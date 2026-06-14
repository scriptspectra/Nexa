import { Webhook } from "svix";
import { createClerkClient } from "@clerk/backend";
import type { WebhookEvent } from "@clerk/backend";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  parseInvoiceDetails,
  parseSubscriptionDetails,
} from "./lib/lemonsqueezy";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || "",
});

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);

    if (!event) {
      return new Response("Error occurred", { status: 400 });
    }

    switch (event.type) {
      case "subscription.updated": {
        const subscription = event.data as {
          status: string;
          payer?: {
            organization_id: string;
          }
        };

        const organizationId = subscription.payer?.organization_id;

        if (!organizationId) {
          return new Response("Missing Organization ID", { status: 400 });
        }

        const newMaxAllowedMemberships = subscription.status === "active" ? 5 : 1;

        await clerkClient.organizations.updateOrganization(organizationId, {
          maxAllowedMemberships: newMaxAllowedMemberships,
        });

        await ctx.runMutation(internal.system.subscriptions.upsert, {
          organizationId,
          status: subscription.status,
        });

        break;
      }
      default:
        console.log("Ignored Clerk webhook event", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/lemonsqueezy-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature") || "";
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "";

    if (!secret) {
      console.error("LEMON_SQUEEZY_WEBHOOK_SECRET is not configured on Convex");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const isValid = await verifyLemonSqueezySignature(rawBody, signature, secret);
    if (!isValid) {
      console.warn("LEMON_SQUEEZY_WEBHOOK_FAILED: Invalid signature verified.");
      return new Response("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    console.log(`LEMON_SQUEEZY_WEBHOOK: Received event "${eventName}"`);

    if (
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired" ||
      eventName === "subscription_resumed"
    ) {
      const organizationId =
        payload.meta?.custom_data?.organizationId ||
        payload.data?.attributes?.custom_data?.organizationId ||
        payload.meta?.custom_data?.organization_id ||
        payload.data?.attributes?.custom_data?.organization_id;

      if (!organizationId) {
        console.error("LEMON_SQUEEZY_WEBHOOK_ERROR: Missing custom organizationId parameter.");
        return new Response("Missing custom organizationId", { status: 400 });
      }

      const subscriptionDetails = parseSubscriptionDetails(
        organizationId,
        payload.data,
      );

      console.log(
        `LEMON_SQUEEZY_WEBHOOK: Organization "${organizationId}" status is "${subscriptionDetails.status}"`,
      );

      await ctx.runMutation(internal.system.subscriptions.upsert, subscriptionDetails);

      const newMaxAllowedMemberships = subscriptionDetails.status === "active" ? 5 : 1;
      try {
        await clerkClient.organizations.updateOrganization(organizationId, {
          maxAllowedMemberships: newMaxAllowedMemberships,
        });
        console.log("LEMON_SQUEEZY_WEBHOOK: Clerk organization membership updated successfully.");
      } catch (clerkErr) {
        console.error("LEMON_SQUEEZY_WEBHOOK_CLERK_UPDATE_ERROR:", clerkErr);
      }
    }

    if (eventName === "subscription_payment_success") {
      let organizationId =
        payload.meta?.custom_data?.organizationId ||
        payload.data?.attributes?.custom_data?.organizationId ||
        payload.meta?.custom_data?.organization_id ||
        payload.data?.attributes?.custom_data?.organization_id;

      if (!organizationId) {
        const subscriptionId = payload.data?.attributes?.subscription_id;
        if (subscriptionId) {
          const subscription = await ctx.runQuery(
            internal.system.subscriptions.getByLemonSubscriptionId,
            { lemonSqueezySubscriptionId: String(subscriptionId) },
          );
          organizationId = subscription?.organizationId;
        }
      }

      if (!organizationId) {
        console.error("LEMON_SQUEEZY_WEBHOOK_ERROR: Missing organizationId on invoice event.");
        return new Response("Missing organizationId", { status: 400 });
      }

      const invoiceDetails = parseInvoiceDetails(organizationId, payload.data);
      await ctx.runMutation(internal.system.billingInvoices.upsert, invoiceDetails);
    }

    return new Response(null, { status: 200 });
  }),
});

async function verifyLemonSqueezySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  
  // Import the secret key for HMAC SHA-256
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Compute expected HMAC signature
  const payloadData = encoder.encode(payload);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData);
  
  // Convert computed hash buffer to hex string
  const computedSignatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return computedSignatureHex === signature.toLowerCase();
}

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id") || "",
    "svix-timestamp": req.headers.get("svix-timestamp") || "",
    "svix-signature": req.headers.get("svix-signature") || "",
  };

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error(`Error verifying webhook event`, error);
    return null;
  }
};

// ─── Shopify Webhook ──────────────────────────────────────────────────────────
// Shopify sends real-time events here when products change or orders are placed.
// We verify the HMAC signature, then dispatch a background sync for the
// affected product — we return 200 immediately to satisfy Shopify's 5s limit.

http.route({
  path: "/shopify-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256") || "";
    const topic = request.headers.get("x-shopify-topic") || "";
    const shopDomain = request.headers.get("x-shopify-shop-domain") || "";

    // Look up which organization this shop domain belongs to
    // We do this by finding the org whose Shopify secret has this domain.
    // For security we also verify the HMAC using SHOPIFY_WEBHOOK_SECRET.
    // NOTE: The shared webhook secret is set at the app level (not per-org) when
    // registering webhooks. Store it as SHOPIFY_WEBHOOK_SECRET in Convex env.
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || "";

    if (webhookSecret) {
      const isValid = await verifyShopifyHmac(rawBody, hmacHeader, webhookSecret);
      if (!isValid) {
        console.warn("SHOPIFY_WEBHOOK: Invalid HMAC signature. Rejecting request.");
        return new Response("Invalid signature", { status: 401 });
      }
    } else {
      console.warn("SHOPIFY_WEBHOOK: SHOPIFY_WEBHOOK_SECRET not set — skipping HMAC check.");
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    console.log(`SHOPIFY_WEBHOOK: Received topic "${topic}" from shop "${shopDomain}"`);

    // Dispatch background work using scheduler so we return 200 immediately
    // Shopify requires responses in under 5 seconds.
    if (topic === "products/update" || topic === "products/create") {
      const productId = payload.id as number | undefined;
      if (productId && shopDomain) {
        await ctx.scheduler.runAfter(0, internal.private.shopify.handleProductWebhook, {
          shopDomain,
          productId,
          deleted: false,
        });
      }
    } else if (topic === "products/delete") {
      const productId = payload.id as number | undefined;
      if (productId && shopDomain) {
        await ctx.scheduler.runAfter(0, internal.private.shopify.handleProductWebhook, {
          shopDomain,
          productId,
          deleted: true,
        });
      }
    } else if (topic === "inventory_levels/update") {
      await ctx.scheduler.runAfter(0, internal.private.shopify.handleInventoryWebhook, {
        shopDomain,
        inventoryItemId: payload.inventory_item_id as number,
      });
    } else {
      console.log(`SHOPIFY_WEBHOOK: Ignored unhandled topic "${topic}"`);
    }

    return new Response(null, { status: 200 });
  }),
});

async function verifyShopifyHmac(
  payload: string,
  hmacHeader: string,
  secret: string
): Promise<boolean> {
  if (!hmacHeader || !secret) return false;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const payloadData = encoder.encode(payload);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData);

  // Shopify sends base64-encoded HMAC
  const computedBase64 = btoa(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );

  return computedBase64 === hmacHeader;
}

export default http;
