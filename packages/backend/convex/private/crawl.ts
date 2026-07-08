import { ConvexError, v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { paginationOptsValidator } from "convex/server";
import rag from "../system/ai/rag";
import { contentHashFromArrayBuffer } from "@convex-dev/rag";
import { Id } from "../_generated/dataModel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrgIdOrThrow(ctx: { auth: { getUserIdentity: () => Promise<any> } }): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });
  const orgId = (identity.orgId || (identity as any).org_id) as string;
  if (!orgId) throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });
  return orgId;
}

/** Scrape a single URL and return { title, text } or null on failure */
async function scrapePage(url: string): Promise<{ title: string; text: string } | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Nexa-KnowledgeBot/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    const html = await response.text();

    // Inline cheerio-compatible minimal HTML text extraction without dynamic import issues
    // Use DOMParser-style regex approach that works in Convex runtime
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : url;

    // Strip scripts, styles, and tags
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) return null;
    return { title, text };
  } catch {
    return null;
  }
}

/** Extract all href links from HTML that belong to the same origin */
function extractInternalLinks(html: string, baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin;
  const linkRegex = /href=["']([^"']+)["']/gi;
  const links = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;

    try {
      const absolute = new URL(href, baseUrl).href;
      const url = new URL(absolute);
      // Same origin only, skip common non-content paths
      if (
        url.origin === origin &&
        !absolute.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|ico|xml|zip|gz|tar|woff|woff2|ttf|eot)$/i)
      ) {
        // Normalize: strip fragments and trailing slashes for dedup
        links.add(`${url.origin}${url.pathname}${url.search}`);
      }
    } catch {
      // invalid URL — skip
    }
  }

  return Array.from(links);
}

/** Parse a sitemap XML and return all <loc> URLs */
async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  const response = await fetch(sitemapUrl, {
    headers: { "User-Agent": "Nexa-KnowledgeBot/1.0" },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new ConvexError({ code: "BAD_REQUEST", message: `Failed to fetch sitemap: ${response.statusText}` });

  const xml = await response.text();

  // Handle sitemap index (nested sitemaps)
  const sitemapIndexMatches = [...xml.matchAll(/<sitemap>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/sitemap>/gi)];
  if (sitemapIndexMatches.length > 0) {
    const nestedUrls: string[] = [];
    for (const m of sitemapIndexMatches.slice(0, 10)) { // limit nested sitemaps
      try {
        const nested = await fetchSitemapUrls(m[1].trim());
        nestedUrls.push(...nested);
      } catch {
        // skip broken nested sitemaps
      }
    }
    return nestedUrls;
  }

  // Regular sitemap
  const locMatches = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)];
  return locMatches.map((m) => m[1].trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Internal mutations for job state management
// ---------------------------------------------------------------------------

export const _createJobRecord = internalMutation({
  args: {
    organizationId: v.string(),
    rootUrl: v.string(),
    mode: v.union(v.literal("single"), v.literal("sitemap"), v.literal("recursive")),
    recrawlIntervalHours: v.optional(v.number()),
    maxDepth: v.optional(v.number()),
    maxPages: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("crawlJobs", {
      organizationId: args.organizationId,
      rootUrl: args.rootUrl,
      mode: args.mode,
      status: "pending",
      recrawlIntervalHours: args.recrawlIntervalHours,
      maxDepth: args.maxDepth ?? 3,
      maxPages: args.maxPages ?? 50,
      pagesFound: 0,
      pagesCrawled: 0,
    });
  },
});

export const _updateJobStatus = internalMutation({
  args: {
    jobId: v.id("crawlJobs"),
    status: v.optional(v.union(v.literal("pending"), v.literal("running"), v.literal("done"), v.literal("error"))),
    pagesFound: v.optional(v.number()),
    pagesCrawled: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    lastCrawledAt: v.optional(v.number()),
    nextCrawlAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { jobId, ...patch } = args;
    // Remove undefined values
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(jobId, cleanPatch as any);
  },
});

export const _getJobById = internalQuery({
  args: { jobId: v.id("crawlJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const _getDueJobs = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("crawlJobs")
      .withIndex("by_next_crawl_at")
      .filter((q) => q.lte(q.field("nextCrawlAt"), now))
      .take(20);
  },
});

// ---------------------------------------------------------------------------
// Core crawler action
// ---------------------------------------------------------------------------

export const runCrawlJob = internalAction({
  args: { jobId: v.id("crawlJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(internal.private.crawl._getJobById, { jobId: args.jobId });
    if (!job) return;

    await ctx.runMutation(internal.private.crawl._updateJobStatus, {
      jobId: args.jobId,
      status: "running",
    });

    try {
      const { rootUrl, mode, maxDepth = 3, maxPages = 50, organizationId } = job;

      // Collect URLs to crawl
      let urlsToCrawl: string[] = [];

      if (mode === "sitemap") {
        const sitemapUrls = await fetchSitemapUrls(rootUrl);
        urlsToCrawl = sitemapUrls.slice(0, maxPages);
      } else if (mode === "recursive") {
        // BFS link discovery
        const visited = new Set<string>();
        const queue: Array<{ url: string; depth: number }> = [{ url: rootUrl, depth: 0 }];
        visited.add(rootUrl);

        while (queue.length > 0 && visited.size <= maxPages) {
          const item = queue.shift();
          if (!item) break;
          const { url, depth } = item;

          urlsToCrawl.push(url);

          if (depth < maxDepth) {
            try {
              const response = await fetch(url, {
                headers: { "User-Agent": "Nexa-KnowledgeBot/1.0" },
                signal: AbortSignal.timeout(10000),
              });
              if (response.ok) {
                const html = await response.text();
                const links = extractInternalLinks(html, url);
                for (const link of links) {
                  if (!visited.has(link) && visited.size <= maxPages) {
                    visited.add(link);
                    queue.push({ url: link, depth: depth + 1 });
                  }
                }
              }
            } catch {
              // Network error on discovery — skip
            }
          }
        }
      } else {
        // single mode
        urlsToCrawl = [rootUrl];
      }

      await ctx.runMutation(internal.private.crawl._updateJobStatus, {
        jobId: args.jobId,
        pagesFound: urlsToCrawl.length,
      });

      // Crawl and ingest each page
      let pagesCrawled = 0;
      for (const url of urlsToCrawl) {
        const result = await scrapePage(url);
        if (!result) continue;

        const { title, text } = result;
        const bytes = new TextEncoder().encode(text).buffer as ArrayBuffer;

        try {
          await rag.add(ctx, {
            namespace: organizationId,
            text,
            key: url,
            title,
            metadata: {
              uploadedBy: organizationId,
              filename: title,
              url,
              crawlJobId: args.jobId,
              category: "web-crawl",
            } as any,
            contentHash: await contentHashFromArrayBuffer(bytes),
          });
          pagesCrawled++;
        } catch {
          // Skip individual page failures
        }
      }

      const nextCrawlAt = job.recrawlIntervalHours
        ? Date.now() + job.recrawlIntervalHours * 60 * 60 * 1000
        : undefined;

      await ctx.runMutation(internal.private.crawl._updateJobStatus, {
        jobId: args.jobId,
        status: "done",
        pagesCrawled,
        lastCrawledAt: Date.now(),
        nextCrawlAt,
      });
    } catch (err: any) {
      await ctx.runMutation(internal.private.crawl._updateJobStatus, {
        jobId: args.jobId,
        status: "error",
        errorMessage: err?.message ?? "Unknown error",
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Scheduled recrawl — called by cron every hour
// ---------------------------------------------------------------------------

export const recrawlDueJobs = internalAction({
  args: {},
  handler: async (ctx) => {
    const dueJobs = await ctx.runQuery(internal.private.crawl._getDueJobs, {});
    for (const job of dueJobs) {
      // Re-run each due job
      await ctx.runAction(internal.private.crawl.runCrawlJob, { jobId: job._id });
    }
  },
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const createCrawlJob = action({
  args: {
    rootUrl: v.string(),
    mode: v.union(v.literal("single"), v.literal("sitemap"), v.literal("recursive")),
    recrawlIntervalHours: v.optional(v.number()),
    maxDepth: v.optional(v.number()),
    maxPages: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdOrThrow(ctx);

    const jobId: Id<"crawlJobs"> = await ctx.runMutation(internal.private.crawl._createJobRecord, {
      organizationId: orgId,
      rootUrl: args.rootUrl,
      mode: args.mode,
      recrawlIntervalHours: args.recrawlIntervalHours,
      maxDepth: args.maxDepth,
      maxPages: args.maxPages,
    });

    // Kick off immediately in background
    await ctx.runAction(internal.private.crawl.runCrawlJob, { jobId });

    return { jobId };
  },
});

export const listCrawlJobs = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });

    return await ctx.db
      .query("crawlJobs")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const deleteCrawlJob = mutation({
  args: { jobId: v.id("crawlJobs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    const orgId = (identity.orgId || (identity as any).org_id) as string;

    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError({ code: "NOT_FOUND", message: "Crawl job not found" });
    if (job.organizationId !== orgId) throw new ConvexError({ code: "UNAUTHORIZED", message: "Access denied" });

    await ctx.db.delete(args.jobId);
  },
});

export const updateCrawlSchedule = mutation({
  args: {
    jobId: v.id("crawlJobs"),
    recrawlIntervalHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    const orgId = (identity.orgId || (identity as any).org_id) as string;

    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError({ code: "NOT_FOUND", message: "Crawl job not found" });
    if (job.organizationId !== orgId) throw new ConvexError({ code: "UNAUTHORIZED", message: "Access denied" });

    const nextCrawlAt =
      args.recrawlIntervalHours && job.lastCrawledAt
        ? job.lastCrawledAt + args.recrawlIntervalHours * 60 * 60 * 1000
        : undefined;

    await ctx.db.patch(args.jobId, {
      recrawlIntervalHours: args.recrawlIntervalHours,
      nextCrawlAt,
    });
  },
});

export const triggerRecrawl = action({
  args: { jobId: v.id("crawlJobs") },
  handler: async (ctx, args) => {
    const orgId = await getOrgIdOrThrow(ctx);
    const job = await ctx.runQuery(internal.private.crawl._getJobById, { jobId: args.jobId });
    if (!job) throw new ConvexError({ code: "NOT_FOUND", message: "Crawl job not found" });
    if (job.organizationId !== orgId) throw new ConvexError({ code: "UNAUTHORIZED", message: "Access denied" });
    await ctx.runAction(internal.private.crawl.runCrawlJob, { jobId: args.jobId });
  },
});
