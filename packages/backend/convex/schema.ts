import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  subscriptions: defineTable({
    organizationId: v.string(),
    status: v.string(),
    lemonSqueezySubscriptionId: v.optional(v.string()),
    lemonSqueezyCustomerId: v.optional(v.string()),
    productName: v.optional(v.string()),
    variantName: v.optional(v.string()),
    statusFormatted: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    cardLastFour: v.optional(v.string()),
    renewsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    updatePaymentMethodUrl: v.optional(v.string()),
    customerPortalUrl: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_lemon_subscription_id", ["lemonSqueezySubscriptionId"]),
  billingInvoices: defineTable({
    organizationId: v.string(),
    lemonSqueezyInvoiceId: v.string(),
    status: v.string(),
    description: v.string(),
    totalFormatted: v.string(),
    invoiceUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_lemon_invoice_id", ["lemonSqueezyInvoiceId"]),
  widgetSettings: defineTable({
    organizationId: v.string(),
    greetMessage: v.string(),
    primaryColor: v.optional(v.string()),
    gradientEndColor: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    defaultSuggestions: v.object({
      suggestion1: v.optional(v.string()),
      suggestion2: v.optional(v.string()),
      suggestion3: v.optional(v.string()),
    }),
    vapiSettings: v.object({
      assistantId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
    }),
  })
    .index("by_organization_id", ["organizationId"]),
  plugins: defineTable({
    organizationId: v.string(),
    service: v.union(v.literal("vapi"), v.literal("shopify")),
    secretName: v.string(),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_organization_id_and_service", ["organizationId", "service"]),
  shopifySyncLog: defineTable({
    organizationId: v.string(),
    status: v.union(
      v.literal("running"),
      v.literal("done"),
      v.literal("error")
    ),
    totalProducts: v.optional(v.number()),
    syncedProducts: v.optional(v.number()),
    lastSyncedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_organization_id", ["organizationId"]),
  conversations: defineTable({
    threadId: v.string(),
    organizationId: v.string(),
    contactSessionId: v.id("contactSessions"),
    status: v.union(
      v.literal("unresolved"),
      v.literal("escalated"),
      v.literal("resolved")
    ),
    // Assignment (Phase 2)
    assignedToUserId: v.optional(v.string()),
    assignedToName: v.optional(v.string()),
    assignedAt: v.optional(v.number()),
    // Timing (Phase 1 & 3)
    firstResponseAt: v.optional(v.number()),
    // Channel (Phase 5 — email / voice)
    channel: v.optional(v.union(v.literal("widget"), v.literal("email"), v.literal("voice"))),
    externalId: v.optional(v.string()),
    // SLA Tracking (Phase 5)
    slaStatus: v.optional(v.union(v.literal("ok"), v.literal("warning"), v.literal("breached"))),
    slaDeadline: v.optional(v.number()),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_contact_session_id", ["contactSessionId"])
    .index("by_thread_id", ["threadId"])
    .index("by_status_and_organization_id", ["status", "organizationId"])
    .index("by_assigned_user", ["assignedToUserId", "organizationId"]),
  contactSessions: defineTable({
    name: v.string(),
    email: v.string(),
    organizationId: v.string(),
    expiresAt: v.number(),
    metadata: v.optional(v.object({
      userAgent: v.optional(v.string()),
      language: v.optional(v.string()),
      languages: v.optional(v.string()),
      platform: v.optional(v.string()),
      vendor: v.optional(v.string()),
      screenResolution: v.optional(v.string()),
      viewportSize: v.optional(v.string()),
      timezone: v.optional(v.string()),
      timezoneOffset: v.optional(v.number()),
      cookieEnabled: v.optional(v.boolean()),
      referrer: v.optional(v.string()),
      currentUrl: v.optional(v.string()),
    }))
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_expires_at", ["expiresAt"]),
  users: defineTable({
    name: v.string(),
  }),

  // Phase 3 — CSAT ratings submitted from the widget after resolution
  csatRatings: defineTable({
    conversationId: v.id("conversations"),
    organizationId: v.string(),
    score: v.number(),                    // 1–5
    comment: v.optional(v.string()),
    submittedAt: v.number(),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_conversation_id", ["conversationId"]),

  // Phase 2 — tracks which onboarding steps an org has completed
  onboardingProgress: defineTable({
    organizationId: v.string(),
    connectedShopify: v.boolean(),
    uploadedFile: v.boolean(),
    customizedWidget: v.boolean(),
    embeddedWidget: v.boolean(),
    invitedTeamMember: v.boolean(),
    dismissed: v.boolean(),
  })
    .index("by_organization_id", ["organizationId"]),

  // Phase 3 — conversation tags
  conversationTags: defineTable({
    conversationId: v.id("conversations"),
    organizationId: v.string(),
    tag: v.string(),
    color: v.optional(v.string()),
    createdByUserId: v.string(),
  })
    .index("by_conversation_id", ["conversationId"])
    .index("by_organization_and_tag", ["organizationId", "tag"]),

  // Phase 4 — canned responses / macros
  macros: defineTable({
    organizationId: v.string(),
    title: v.string(),
    content: v.string(),
    shortcut: v.optional(v.string()),
    createdByUserId: v.string(),
    isShared: v.boolean(),
  })
    .index("by_organization_id", ["organizationId"]),

  // Phase 5 — public REST API keys
  apiKeys: defineTable({
    organizationId: v.string(),
    name: v.string(),
    keyHash: v.string(),
    keyPrefix: v.string(),
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    scopes: v.array(v.string()),
    createdByUserId: v.string(),
    revoked: v.boolean(),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_key_hash", ["keyHash"]),

  // Phase 5 — SLA configuration
  slaConfig: defineTable({
    organizationId: v.string(),
    firstResponseTargetMs: v.number(),
    resolutionTargetMs: v.number(),
    businessHoursStart: v.number(),
    businessHoursEnd: v.number(),
    businessDays: v.array(v.number()),
    timezone: v.string(),
  })
    .index("by_organization_id", ["organizationId"]),

  // Phase 5 — audit log
  auditLog: defineTable({
    organizationId: v.string(),
    actorUserId: v.string(),
    actorName: v.string(),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_actor", ["actorUserId", "organizationId"]),

  // Phase 6 — outbound webhook endpoints
  webhookEndpoints: defineTable({
    organizationId: v.string(),
    url: v.string(),
    secret: v.string(),
    events: v.array(v.string()),
    enabled: v.boolean(),
  })
    .index("by_organization_id", ["organizationId"]),

  // Phase 5 — Usage limits
  usageCounters: defineTable({
    organizationId: v.string(),
    month: v.string(), // e.g., "2026-06"
    aiResponsesCount: v.number(),
  })
    .index("by_organization_and_month", ["organizationId", "month"]),
});
