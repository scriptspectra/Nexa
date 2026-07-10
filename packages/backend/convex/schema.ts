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
    threadId: v.string(), // Kept for legacy agent compatibility if needed
    organizationId: v.string(),
    contactId: v.optional(v.id("contacts")), // Optional for legacy UI migration
    contactSessionId: v.optional(v.id("contactSessions")), // Restored for UI compatibility
    status: v.union(
      v.literal("unresolved"),
      v.literal("escalated"),
      v.literal("resolved")
    ),
    owner: v.optional(v.union(
      v.literal("AI_ONLY"),
      v.literal("AI_ASSISTED"),
      v.literal("HUMAN_ONLY")
    )),
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
    .index("by_contact_id", ["contactId"])
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

  // Phase 6 — Push notifications
  pushSubscriptions: defineTable({
    userId: v.string(),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
  })
    .index("by_user_id", ["userId"]),
  // Web crawl jobs — sitemap, recursive link-following, and scheduled re-crawl
  crawlJobs: defineTable({
    organizationId: v.string(),
    rootUrl: v.string(),
    mode: v.union(
      v.literal("single"),
      v.literal("sitemap"),
      v.literal("recursive"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("done"),
      v.literal("error"),
    ),
    recrawlIntervalHours: v.optional(v.number()),  // null = no auto recrawl
    maxDepth: v.optional(v.number()),              // for recursive mode
    maxPages: v.optional(v.number()),              // safety cap
    pagesFound: v.optional(v.number()),
    pagesCrawled: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    lastCrawledAt: v.optional(v.number()),
    nextCrawlAt: v.optional(v.number()),           // used by the recrawl cron
    firecrawlJobId: v.optional(v.string()),        // Track external FireCrawl job ID
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_next_crawl_at", ["nextCrawlAt"])
    .index("by_status", ["status"]),

  // Superadmin tables
  suspended_orgs: defineTable({
    orgId: v.string(),
    suspendedAt: v.number(),
  }).index("by_orgId", ["orgId"]),
  system_logs: defineTable({
    timestamp: v.number(),
    type: v.string(),
    message: v.string(),
  }).index("by_timestamp", ["timestamp"]).index("by_type", ["type"]),

  // Phase 1 - Omni-Channel Entities

  contacts: defineTable({
    organizationId: v.string(),
    mergedContactId: v.optional(v.id("contacts")), // For identity resolution
    name: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  }).index("by_organization_id", ["organizationId"]),

  contactIdentities: defineTable({
    contactId: v.id("contacts"),
    provider: v.string(), // 'whatsapp', 'email', 'widget'
    externalId: v.string(),
  })
    .index("by_contact_id", ["contactId"])
    .index("by_external_id", ["externalId", "provider"]),

  integrations: defineTable({
    organizationId: v.string(),
    provider: v.string(), // 'meta', 'slack', etc.
    status: v.union(
      v.literal("created"),
      v.literal("oauth_pending"),
      v.literal("connected"),
      v.literal("syncing"),
      v.literal("healthy"),
      v.literal("reconnect_required"),
      v.literal("disconnected")
    ),
    credentialsId: v.optional(v.string()), // Reference to secret or config
    accessToken: v.optional(v.string()), // Encrypted token
    refreshToken: v.optional(v.string()), // Encrypted token
    lastSyncedAt: v.optional(v.number()),
    lastHealthyAt: v.optional(v.number()),
    errorState: v.optional(v.string()),
  }).index("by_organization_id", ["organizationId"])
    .index("by_organization_id_and_provider", ["organizationId", "provider"]),

  integrationResources: defineTable({
    organizationId: v.string(),
    integrationId: v.id("integrations"),
    provider: v.string(), // "meta", "slack"
    resourceType: v.string(), // "facebook_page", "instagram_account", "slack_channel"
    externalResourceId: v.string(), // e.g., Facebook Page ID
    name: v.string(),
    capabilities: v.any(), // e.g., { messaging: true, media: true }
    status: v.union(v.literal("active"), v.literal("disconnected")),
  }).index("by_external_resource_id", ["externalResourceId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("file"), v.literal("audio")),
    integrationId: v.optional(v.id("integrations")),
    channel: v.string(), // 'whatsapp', 'widget'
    externalMessageId: v.optional(v.string()),
    deliveryStatus: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("read"),
      v.literal("failed")
    ),
    createdAt: v.optional(v.number()),
  })
    .index("by_conversation_id", ["conversationId"])
    .index("by_external_message_id", ["externalMessageId"]),

  outboxMessages: defineTable({
    messageId: v.id("messages"),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("failed")),
    retryCount: v.number(),
    lastAttemptAt: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_status", ["status"]),

});
