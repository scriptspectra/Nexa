"use node";

import { ConvexError, v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { Doc } from "../_generated/dataModel";
import {
  fetchSubscription,
  fetchSubscriptionInvoices,
  formatCardBrand,
  formatInvoiceDate,
  formatRenewalDate,
  isActiveSubscriptionStatus,
  isPaidForCurrentPeriod,
  parseInvoiceDetails,
  parseSubscriptionDetails,
} from "../lib/lemonsqueezy";

type BillingDetailsResponse = {
  isPro: boolean;
  canPurchase: boolean;
  planName: string;
  planPrice: string;
  status: string;
  statusFormatted: string;
  productName?: string;
  variantName?: string;
  renewsAt?: number;
  renewsAtLabel: string | null;
  endsAt?: number;
  paymentMethod: {
    brand: string;
    lastFour: string;
    label: string;
  } | null;
  updatePaymentMethodUrl: string | null;
  customerPortalUrl: string | null;
  invoices: Array<{
    id: string;
    date: string;
    description: string;
    amount: string;
    invoiceUrl: string | null;
    status: string;
  }>;
};

export const syncAndGetDetails = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args): Promise<BillingDetailsResponse> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const orgId = (identity.orgId || (identity as { org_id?: string }).org_id) as string;

    if (!orgId) {
      return {
        isPro: false,
        canPurchase: true,
        planName: "Starter",
        planPrice: "$0",
        status: "inactive",
        statusFormatted: "Inactive",
        renewsAtLabel: null,
        paymentMethod: null,
        updatePaymentMethodUrl: null,
        customerPortalUrl: null,
        invoices: [],
      };
    }

    if (orgId !== args.organizationId) {
      throw new ConvexError("Organization not found");
    }

    let subscription: Doc<"subscriptions"> | null = await ctx.runQuery(
      internal.system.subscriptions.getByOrganizationId,
      { organizationId: args.organizationId },
    );

    if (subscription?.lemonSqueezySubscriptionId && process.env.LEMON_SQUEEZY_API_KEY) {
      try {
        const remoteSubscription = await fetchSubscription(
          subscription.lemonSqueezySubscriptionId,
        );
        const parsedSubscription = parseSubscriptionDetails(
          args.organizationId,
          remoteSubscription.data,
        );

        await ctx.runMutation(internal.system.subscriptions.upsert, parsedSubscription);
        subscription = await ctx.runQuery(
          internal.system.subscriptions.getByOrganizationId,
          { organizationId: args.organizationId },
        );

        const remoteInvoices = await fetchSubscriptionInvoices(
          subscription!.lemonSqueezySubscriptionId!,
        );

        for (const invoice of remoteInvoices.data) {
          const parsedInvoice = parseInvoiceDetails(args.organizationId, invoice);
          await ctx.runMutation(internal.system.billingInvoices.upsert, parsedInvoice);
        }
      } catch (error) {
        console.error("LEMON_SQUEEZY_SYNC_ERROR:", error);
      }
    }

    const invoices: Doc<"billingInvoices">[] = await ctx.runQuery(
      internal.system.billingInvoices.getByOrganizationId,
      { organizationId: args.organizationId },
    );

    const isPro = isActiveSubscriptionStatus(subscription?.status);
    const canPurchase = !isPaidForCurrentPeriod(subscription);
    const planName = subscription?.variantName || subscription?.productName || "Starter";
    const planPrice = isPro ? "$19" : "$0";

    return {
      isPro,
      canPurchase,
      planName,
      planPrice,
      status: subscription?.status ?? "inactive",
      statusFormatted: subscription?.statusFormatted ?? (isPro ? "Active" : "Inactive"),
      productName: subscription?.productName,
      variantName: subscription?.variantName,
      renewsAt: subscription?.renewsAt,
      renewsAtLabel: formatRenewalDate(subscription?.renewsAt),
      endsAt: subscription?.endsAt,
      paymentMethod: subscription?.cardBrand && subscription?.cardLastFour
        ? {
            brand: formatCardBrand(subscription.cardBrand),
            lastFour: subscription.cardLastFour,
            label: `${formatCardBrand(subscription.cardBrand)} ending in ${subscription.cardLastFour}`,
          }
        : null,
      updatePaymentMethodUrl: subscription?.updatePaymentMethodUrl ?? null,
      customerPortalUrl: subscription?.customerPortalUrl ?? null,
      invoices: invoices.map((invoice: any) => ({
        id: invoice.lemonSqueezyInvoiceId,
        date: formatInvoiceDate(invoice.createdAt),
        description: invoice.description,
        amount: invoice.totalFormatted,
        invoiceUrl: invoice.invoiceUrl ?? null,
        status: invoice.status,
      })),
    };
  },
});
