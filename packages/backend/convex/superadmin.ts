// Convex admin API for superadmin dashboard
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireSuperadmin } from "./lib/superadminAuth";

/*** READ‑ONLY QUERIES ***/
export const listOrganizations = query({
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    const orgs = await ctx.db.query("organizations").order("desc").collect();
    const suspended = await ctx.db.query("suspended_orgs").collect();
    const suspMap = new Map(suspended.map((s) => [s.orgId, s.suspendedAt]));
    return orgs.map((o) => ({
      _id: o._id,
      name: o.name,
      plan: o.plan,
      usage: o.usage,
      createdAt: o.createdAt,
      isSuspended: !!suspMap.get(o._id),
    }));
  },
});

export const listUsers = query({
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    return await ctx.db.query("users").order("desc").collect();
  },
});

export const listUsage = query({
  args: { months: v.optional(v.number()) },
  handler: async (ctx, { months }) => {
    await requireSuperadmin(ctx);
    const limit = months ?? 1;
    const now = Date.now();
    const start = now - limit * 30 * 24 * 60 * 60 * 1000;
    const counters = await ctx.db
      .query("usageCounters")
      .filter((q) => q.gte("timestamp", start))
      .collect();
    const agg = {};
    for (const c of counters) {
      agg[c.organizationId] = (agg[c.organizationId] ?? 0) + c.aiResponsesCount;
    }
    return agg;
  },
});

export const systemHealth = query({
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    return { convex: "OK", openAI: "OK", webhookSuccessRate: "N/A" };
  },
});

export const listLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await requireSuperadmin(ctx);
    const n = limit ?? 500;
    const logs = await ctx.db.query("system_logs").order("desc").take(n);
    return logs.map((l) => ({
      timestamp: l.timestamp,
      type: l.type,
      message: l.message.replace(/(?:key|token)=\w+/gi, "[MASKED]"),
    }));
  },
});

/*** MUTATIONS ***/
export const suspendOrg = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await requireSuperadmin(ctx);
    await ctx.db.insert("suspended_orgs", { orgId, suspendedAt: Date.now() });
  },
});

export const unsuspendOrg = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await requireSuperadmin(ctx);
    const entry = await ctx.db
      .query("suspended_orgs")
      .filter((q) => q.eq("orgId", orgId))
      .unique();
    if (entry) await ctx.db.delete(entry._id);
  },
});

export const resetOrgUsage = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await requireSuperadmin(ctx);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const counters = await ctx.db
      .query("usageCounters")
      .filter((q) => q.eq("organizationId", orgId) && q.eq("month", thisMonth))
      .collect();
    for (const c of counters) await ctx.db.delete(c._id);
  },
});

export const isSuperadmin = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    return (identity.publicMetadata ?? {}).role === "superadmin";
  },
});
