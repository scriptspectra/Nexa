/**
 * Shopify Admin REST API client helpers.
 * Used by private/shopify.ts and the HTTP webhook handler.
 */

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  status: string;
  variants: ShopifyVariant[];
  images: { src: string }[];
}

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  sku: string;
  inventory_quantity: number;
  available: boolean;
}

/**
 * Fetches ALL products from a Shopify store using the Admin REST API.
 * Handles pagination automatically.
 */
export async function fetchAllShopifyProducts(
  shopDomain: string,
  adminApiKey: string
): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let pageInfo: string | null = null;
  const limit = 250; // Shopify max per page

  do {
    const url: string = pageInfo
      ? `https://${shopDomain}/admin/api/2024-10/products.json?limit=${limit}&page_info=${pageInfo}&fields=id,title,body_html,vendor,product_type,tags,status,variants,images`
      : `https://${shopDomain}/admin/api/2024-10/products.json?limit=${limit}&fields=id,title,body_html,vendor,product_type,tags,status,variants,images`;

    const response: any = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": adminApiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as { products: ShopifyProduct[] };
    allProducts.push(...data.products);

    // Handle pagination via Link header
    const linkHeader: string = response.headers.get("Link") || "";
    const nextMatch: RegExpMatchArray | null = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/);
    pageInfo = nextMatch?.[1] ?? null;
  } while (pageInfo);

  return allProducts;
}

/**
 * Fetches a single product by ID from Shopify.
 */
export async function fetchShopifyProduct(
  shopDomain: string,
  adminApiKey: string,
  productId: number
): Promise<ShopifyProduct | null> {
  const url: string = `https://${shopDomain}/admin/api/2024-10/products/${productId}.json`;

  const response: any = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": adminApiKey,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { product: ShopifyProduct };
  return data.product;
}

/**
 * Converts a Shopify product object into a natural-language text
 * that can be indexed by the RAG system.
 */
export function productToRagText(product: ShopifyProduct): string {
  const lines: string[] = [];

  lines.push(`Product: ${product.title}`);

  if (product.vendor) {
    lines.push(`Brand/Vendor: ${product.vendor}`);
  }

  if (product.product_type) {
    lines.push(`Category: ${product.product_type}`);
  }

  // Strip HTML from description
  const description = product.body_html
    ? product.body_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";
  if (description) {
    lines.push(`Description: ${description}`);
  }

  const isAvailable =
    product.status === "active" &&
    product.variants.some((v) => v.inventory_quantity > 0);
  lines.push(`Available: ${isAvailable ? "Yes" : "No"}`);

  if (product.variants.length === 1 && product.variants[0]?.title === "Default Title") {
    // Simple product with no variants
    const v = product.variants[0]!;
    lines.push(`Price: $${v.price}`);
    lines.push(`In Stock: ${v.inventory_quantity > 0 ? `${v.inventory_quantity} units` : "Out of stock"}`);
    if (v.sku) lines.push(`SKU: ${v.sku}`);
  } else {
    // Product with multiple variants
    lines.push(`Variants:`);
    for (const variant of product.variants) {
      const stockStatus =
        variant.inventory_quantity > 0
          ? `In Stock: ${variant.inventory_quantity} units`
          : "Out of stock";
      const skuPart = variant.sku ? ` | SKU: ${variant.sku}` : "";
      lines.push(
        `  - ${variant.title}: $${variant.price} | ${stockStatus}${skuPart}`
      );
    }
  }

  if (product.tags) {
    lines.push(`Tags: ${product.tags}`);
  }

  return lines.join("\n");
}

/**
 * Registers a webhook on the Shopify store so Shopify sends us events.
 */
export async function registerShopifyWebhook(
  shopDomain: string,
  adminApiKey: string,
  topic: string,
  callbackUrl: string
): Promise<void> {
  const url: string = `https://${shopDomain}/admin/api/2024-10/webhooks.json`;

  const response: any = await fetch(url, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": adminApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      webhook: {
        topic,
        address: callbackUrl,
        format: "json",
      },
    }),
  });

  // 422 means webhook already exists — that's fine
  if (!response.ok && response.status !== 422) {
    const errorText = await response.text();
    throw new Error(
      `Failed to register Shopify webhook "${topic}" (${response.status}): ${errorText}`
    );
  }
}

/**
 * Validates Shopify credentials by making a lightweight API call.
 * Returns the shop name on success, throws on failure.
 */
export async function validateShopifyCredentials(
  shopDomain: string,
  adminApiKey: string
): Promise<string> {
  const url: string = `https://${shopDomain}/admin/api/2024-10/shop.json?fields=name,domain`;

  const response: any = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": adminApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Invalid Shopify credentials. Please check your shop domain and Admin API key. (${response.status})`
    );
  }

  const data = (await response.json()) as { shop: { name: string } };
  return data.shop.name;
}

/**
 * Look up a Shopify order by its name/number (e.g. #1001 or 1001).
 */
export async function fetchShopifyOrderByName(
  shopDomain: string,
  adminApiKey: string,
  orderName: string
): Promise<any | null> {
  // Order name might be passed as "#1001" or "1001"
  const cleanName = orderName.startsWith("#") ? orderName : `#${orderName}`;
  const url = `https://${shopDomain}/admin/api/2024-10/orders.json?status=any&name=${encodeURIComponent(cleanName)}`;

  const response: any = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": adminApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error (${response.status})`);
  }

  const data = await response.json();
  const orders = data.orders || [];
  
  // Return the first match, or null
  return orders.length > 0 ? orders[0] : null;
}

