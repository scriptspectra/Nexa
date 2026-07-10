import { action, internalAction, internalQuery, mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";

// Generate a random webhook secret
function generateSecret(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let secret = "whsec_";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// ----------------------------------------------------
// Public APIs (for Org Admins in the settings dashboard)
// ----------------------------------------------------

export const create = mutation({
  args: {
    url: v.string(),
    events: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not logged in" });
    }
    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "No active organization" });
    }

    // Validate URL schema
    if (!args.url.startsWith("http://") && !args.url.startsWith("https://")) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "URL must start with http:// or https://" });
    }

    const secret = generateSecret();
    const id = await ctx.db.insert("webhookEndpoints", {
      organizationId: orgId,
      url: args.url,
      secret,
      events: args.events,
      enabled: true,
    });

    return { id, secret };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) return [];

    return await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .collect();
  },
});

export const remove = mutation({
  args: {
    id: v.id("webhookEndpoints"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not logged in" });
    }
    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "No active organization" });
    }

    const endpoint = await ctx.db.get(args.id);
    if (!endpoint) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Webhook endpoint not found" });
    }

    if (endpoint.organizationId !== orgId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Permission denied" });
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ----------------------------------------------------
// Internal Helpers / Actions for Event Dispatching
// ----------------------------------------------------

export const getEndpointsForOrg = internalQuery({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("enabled"), true))
      .collect();
  },
});

// WebCrypto helper to sign payload
async function computeSignature(secret: string, payload: string, timestamp: number): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const msgData = encoder.encode(`${timestamp}.${payload}`);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, msgData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  return signatureArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export const dispatchEventAction = internalAction({
  args: {
    organizationId: v.string(),
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // 1. Fetch webhook endpoints
    const endpoints = await ctx.runQuery(internal.private.webhooks.getEndpointsForOrg, {
      organizationId: args.organizationId,
    });

    const matchingEndpoints = endpoints.filter((ep: any) => 
      ep.events.includes(args.eventType) || ep.events.includes("*")
    );

    if (matchingEndpoints.length === 0) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const jsonPayload = JSON.stringify({
      event: args.eventType,
      timestamp,
      data: args.payload,
    });

    // 2. Dispatch HTTP requests in parallel
    await Promise.allSettled(
      matchingEndpoints.map(async (ep: any) => {
        try {
          const signature = await computeSignature(ep.secret, jsonPayload, timestamp);
          const response = await fetch(ep.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Zephyra-Signature": `t=${timestamp},v1=${signature}`,
              "X-Zephyra-Event": args.eventType,
            },
            body: jsonPayload,
            // 5 second timeout
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            console.warn(`Webhook failed to ${ep.url}: HTTP ${response.status}`);
          }
        } catch (error) {
          console.error(`Webhook error sending to ${ep.url}:`, error);
        }
      })
    );
  },
});
