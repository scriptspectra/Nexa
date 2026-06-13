import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

export const upsert = internalMutation({
  args: {
    organizationId: v.string(),
    lemonSqueezyInvoiceId: v.string(),
    status: v.string(),
    description: v.string(),
    totalFormatted: v.string(),
    invoiceUrl: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existingInvoice = await ctx.db
      .query("billingInvoices")
      .withIndex("by_lemon_invoice_id", (q) =>
        q.eq("lemonSqueezyInvoiceId", args.lemonSqueezyInvoiceId),
      )
      .unique();

    if (existingInvoice) {
      await ctx.db.patch(existingInvoice._id, args);
      return existingInvoice._id;
    }

    return await ctx.db.insert("billingInvoices", args);
  },
});

export const getByOrganizationId = internalQuery({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("billingInvoices")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    return invoices.sort((a, b) => b.createdAt - a.createdAt);
  },
});
