import { createHmac, timingSafeEqual } from "crypto";

export const SHOPIFY_SCOPES = "read_products,read_inventory";

export function getShopifyApiKey(): string {
  const key = process.env.SHOPIFY_API_KEY;
  if (!key) {
    throw new Error("SHOPIFY_API_KEY is not configured");
  }
  return key;
}

export function getShopifyApiSecret(): string {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    throw new Error("SHOPIFY_API_SECRET is not configured");
  }
  return secret;
}

export function getShopifyAppUrl(): string {
  const url =
    process.env.SHOPIFY_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL;

  if (!url) {
    throw new Error("SHOPIFY_APP_URL or NEXT_PUBLIC_APP_URL must be configured");
  }

  return url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url.replace(/\/$/, "")}`;
}

export function getShopifyRedirectUri(): string {
  return `${getShopifyAppUrl()}/api/shopify/callback`;
}

export function normalizeShopDomain(shop: string): string {
  let domain = shop
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .trim()
    .toLowerCase();

  if (!domain.includes(".")) {
    domain = `${domain}.myshopify.com`;
  }

  if (!domain.endsWith(".myshopify.com")) {
    throw new Error("Shop domain must be a valid *.myshopify.com store");
  }

  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) {
    throw new Error("Invalid Shopify shop domain format");
  }

  return domain;
}

export function createOAuthState(organizationId: string, shopDomain: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      organizationId,
      shopDomain,
      ts: Date.now(),
    }),
  ).toString("base64url");

  const signature = createHmac("sha256", getShopifyApiSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function parseOAuthState(
  state: string,
): { organizationId: string; shopDomain: string } | null {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getShopifyApiSecret())
    .update(payload)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      organizationId?: string;
      shopDomain?: string;
      ts?: number;
    };

    if (!parsed.organizationId || !parsed.shopDomain || !parsed.ts) {
      return null;
    }

    if (Date.now() - parsed.ts > 10 * 60 * 1000) {
      return null;
    }

    return {
      organizationId: parsed.organizationId,
      shopDomain: parsed.shopDomain,
    };
  } catch {
    return null;
  }
}

export function verifyShopifyOAuthHmac(
  searchParams: URLSearchParams,
  secret: string,
): boolean {
  const hmac = searchParams.get("hmac");
  if (!hmac) {
    return false;
  }

  const entries = Array.from(searchParams.entries())
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([left], [right]) => left.localeCompare(right));

  const message = entries.map(([key, value]) => `${key}=${value}`).join("&");
  const generated = createHmac("sha256", secret).update(message).digest("hex");

  const generatedBuffer = Buffer.from(generated, "utf8");
  const hmacBuffer = Buffer.from(hmac, "utf8");

  if (generatedBuffer.length !== hmacBuffer.length) {
    return false;
  }

  return timingSafeEqual(generatedBuffer, hmacBuffer);
}

export function buildShopifyAuthorizeUrl(shopDomain: string, state: string): string {
  const params = new URLSearchParams({
    client_id: getShopifyApiKey(),
    scope: SHOPIFY_SCOPES,
    redirect_uri: getShopifyRedirectUri(),
    state,
  });

  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeShopifyAccessToken(
  shopDomain: string,
  code: string,
): Promise<string> {
  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: getShopifyApiKey(),
      client_secret: getShopifyApiSecret(),
      code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange Shopify OAuth code (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Shopify OAuth response did not include an access token");
  }

  return data.access_token;
}

export function getShopifyOAuthServerSecret(): string {
  const secret = process.env.SHOPIFY_OAUTH_SERVER_SECRET;
  if (!secret) {
    throw new Error("SHOPIFY_OAUTH_SERVER_SECRET is not configured");
  }
  return secret;
}
