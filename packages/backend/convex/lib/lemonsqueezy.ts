const LEMON_SQUEEZY_API_URL = "https://api.lemonsqueezy.com/v1";

type LemonSubscriptionAttributes = {
  customer_id?: number;
  product_name?: string;
  variant_name?: string;
  status?: string;
  status_formatted?: string;
  card_brand?: string;
  card_last_four?: string;
  renews_at?: string | null;
  ends_at?: string | null;
  urls?: {
    update_payment_method?: string;
    customer_portal?: string;
  };
};

type LemonSubscriptionPayload = {
  id: string | number;
  attributes: LemonSubscriptionAttributes;
};

type LemonInvoiceAttributes = {
  status?: string;
  billing_reason?: string;
  total_formatted?: string;
  created_at?: string;
  subscription_id?: number;
  urls?: {
    invoice_url?: string;
  };
};

type LemonInvoicePayload = {
  id: string | number;
  attributes: LemonInvoiceAttributes;
};

export type StoredSubscriptionDetails = {
  organizationId: string;
  status: string;
  lemonSqueezySubscriptionId?: string;
  lemonSqueezyCustomerId?: string;
  productName?: string;
  variantName?: string;
  statusFormatted?: string;
  cardBrand?: string;
  cardLastFour?: string;
  renewsAt?: number;
  endsAt?: number;
  updatePaymentMethodUrl?: string;
  customerPortalUrl?: string;
  updatedAt?: number;
};

export type StoredBillingInvoice = {
  organizationId: string;
  lemonSqueezyInvoiceId: string;
  status: string;
  description: string;
  totalFormatted: string;
  invoiceUrl?: string;
  createdAt: number;
};

export function normalizeSubscriptionStatus(status?: string): string {
  if (status === "active" || status === "on_trial") {
    return "active";
  }

  return status ?? "inactive";
}

export function isActiveSubscriptionStatus(status?: string): boolean {
  return status === "active" || status === "on_trial";
}

export function isPaidForCurrentPeriod(subscription?: {
  status?: string;
  renewsAt?: number;
  endsAt?: number;
} | null): boolean {
  if (!subscription || !isActiveSubscriptionStatus(subscription.status)) {
    return false;
  }

  const periodEnd = subscription.renewsAt ?? subscription.endsAt;
  if (periodEnd) {
    return periodEnd > Date.now();
  }

  return true;
}

export function parseSubscriptionDetails(
  organizationId: string,
  payload: LemonSubscriptionPayload,
): StoredSubscriptionDetails {
  const attributes = payload.attributes;

  return {
    organizationId,
    status: normalizeSubscriptionStatus(attributes.status),
    lemonSqueezySubscriptionId: String(payload.id),
    lemonSqueezyCustomerId: attributes.customer_id
      ? String(attributes.customer_id)
      : undefined,
    productName: attributes.product_name,
    variantName: attributes.variant_name,
    statusFormatted: attributes.status_formatted,
    cardBrand: attributes.card_brand || undefined,
    cardLastFour: attributes.card_last_four || undefined,
    renewsAt: attributes.renews_at ? Date.parse(attributes.renews_at) : undefined,
    endsAt: attributes.ends_at ? Date.parse(attributes.ends_at) : undefined,
    updatePaymentMethodUrl: attributes.urls?.update_payment_method,
    customerPortalUrl: attributes.urls?.customer_portal,
    updatedAt: Date.now(),
  };
}

export function parseInvoiceDetails(
  organizationId: string,
  payload: LemonInvoicePayload,
): StoredBillingInvoice {
  const attributes = payload.attributes;
  const description =
    attributes.billing_reason === "renewal"
      ? "Professional Monthly Plan"
      : attributes.billing_reason === "initial"
        ? "Professional Plan - Initial Payment"
        : "Professional Plan";

  return {
    organizationId,
    lemonSqueezyInvoiceId: String(payload.id),
    status: attributes.status ?? "paid",
    description,
    totalFormatted: attributes.total_formatted ?? "$0.00",
    invoiceUrl: attributes.urls?.invoice_url,
    createdAt: attributes.created_at
      ? Date.parse(attributes.created_at)
      : Date.now(),
  };
}

export async function lemonSqueezyFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

  if (!apiKey) {
    throw new Error("LEMON_SQUEEZY_API_KEY is not configured");
  }

  const response = await fetch(`${LEMON_SQUEEZY_API_URL}${path}`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lemon Squeezy API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchSubscription(subscriptionId: string) {
  return lemonSqueezyFetch<{ data: LemonSubscriptionPayload }>(
    `/subscriptions/${subscriptionId}`,
  );
}

export async function fetchSubscriptionInvoices(subscriptionId: string) {
  return lemonSqueezyFetch<{ data: LemonInvoicePayload[] }>(
    `/subscription-invoices?filter[subscription_id]=${subscriptionId}&sort=-created_at`,
  );
}

export function formatCardBrand(brand?: string): string {
  if (!brand) {
    return "Card";
  }

  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function formatInvoiceDate(timestamp: number): string {
  return new Date(timestamp)
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    .toUpperCase();
}

export function formatRenewalDate(timestamp?: number): string | null {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
