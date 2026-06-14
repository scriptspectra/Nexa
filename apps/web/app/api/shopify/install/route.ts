import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  buildShopifyAuthorizeUrl,
  createOAuthState,
  normalizeShopDomain,
} from "@/lib/shopify-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.redirect(
        new URL("/org-selection?redirectUrl=/integrations", request.url),
      );
    }

    const shopParam = request.nextUrl.searchParams.get("shop");
    if (!shopParam) {
      return NextResponse.redirect(
        new URL("/integrations?shopify=error&message=Missing%20shop%20domain", request.url),
      );
    }

    const shopDomain = normalizeShopDomain(shopParam);
    const state = createOAuthState(orgId, shopDomain);
    const authorizeUrl = buildShopifyAuthorizeUrl(shopDomain, state);

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start Shopify OAuth";
    return NextResponse.redirect(
      new URL(
        `/integrations?shopify=error&message=${encodeURIComponent(message)}`,
        request.url,
      ),
    );
  }
}
