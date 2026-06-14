import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@workspace/backend/_generated/api";
import {
  exchangeShopifyAccessToken,
  getShopifyApiSecret,
  getShopifyOAuthServerSecret,
  normalizeShopDomain,
  parseOAuthState,
  verifyShopifyOAuthHmac,
} from "@/lib/shopify-oauth";

export const dynamic = "force-dynamic";

function redirectWithStatus(
  request: NextRequest,
  status: "connected" | "error",
  details?: { shopName?: string; message?: string },
) {
  const url = new URL("/integrations", request.url);
  url.searchParams.set("shopify", status);

  if (details?.shopName) {
    url.searchParams.set("shop", details.shopName);
  }

  if (details?.message) {
    url.searchParams.set("message", details.message);
  }

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");

  if (!code || !shop || !state) {
    return redirectWithStatus(request, "error", {
      message: "Missing Shopify OAuth parameters",
    });
  }

  try {
    if (!verifyShopifyOAuthHmac(searchParams, getShopifyApiSecret())) {
      return redirectWithStatus(request, "error", {
        message: "Invalid Shopify OAuth signature",
      });
    }

    const parsedState = parseOAuthState(state);
    if (!parsedState) {
      return redirectWithStatus(request, "error", {
        message: "Invalid or expired OAuth state",
      });
    }

    const shopDomain = normalizeShopDomain(shop);
    if (shopDomain !== parsedState.shopDomain) {
      return redirectWithStatus(request, "error", {
        message: "Shop domain does not match the original OAuth request",
      });
    }

    const accessToken = await exchangeShopifyAccessToken(shopDomain, code);

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
    }

    const convex = new ConvexHttpClient(convexUrl);
    const result = await convex.action(api.private.shopify.finalizeShopifyOAuth, {
      organizationId: parsedState.organizationId,
      shopDomain,
      accessToken,
      serverSecret: getShopifyOAuthServerSecret(),
    });

    return redirectWithStatus(request, "connected", {
      shopName: result.shopName,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to complete Shopify OAuth";
    return redirectWithStatus(request, "error", { message });
  }
}
