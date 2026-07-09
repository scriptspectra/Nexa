import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import rag from "./ai/rag";
import { internal } from "../_generated/api";
import { contentHashFromArrayBuffer } from "@convex-dev/rag";

export const processWebhook = internalAction({
  args: {
    jobId: v.id("crawlJobs"),
    orgId: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const { jobId, orgId, payload } = args;

    try {
      const job = await ctx.runQuery(internal.private.crawl._getJobById, { jobId });
      if (!job) {
        console.error("FireCrawl Webhook: Job not found", jobId);
        return;
      }

      const documents = payload.data || [];
      let pagesCrawled = 0;

      for (const doc of documents) {
        if (!doc.markdown) continue;

        const text = doc.markdown;
        const title = doc.metadata?.title || doc.metadata?.sourceURL || "Untitled Page";
        const url = doc.metadata?.sourceURL || job.rootUrl;

        const bytes = new TextEncoder().encode(text).buffer as ArrayBuffer;

        try {
          await rag.add(ctx, {
            namespace: orgId,
            text,
            key: url,
            title,
            metadata: {
              uploadedBy: orgId,
              filename: title,
              url,
              crawlJobId: jobId,
              category: "web-crawl",
            } as any,
            contentHash: await contentHashFromArrayBuffer(bytes),
          });
          pagesCrawled++;
        } catch (e) {
          console.log(`FireCrawl Webhook: Skipped unchanged or failed ingest for ${url}`);
        }
      }

      const nextCrawlAt = job.recrawlIntervalHours
        ? Date.now() + job.recrawlIntervalHours * 60 * 60 * 1000
        : undefined;

      await ctx.runMutation(internal.private.crawl._updateJobStatus, {
        jobId,
        status: "done",
        pagesCrawled,
        pagesFound: documents.length, 
        lastCrawledAt: Date.now(),
        nextCrawlAt,
      });

    } catch (e: any) {
      console.error("FireCrawl Webhook processing failed:", e);
      await ctx.runMutation(internal.private.crawl._updateJobStatus, {
        jobId,
        status: "error",
        errorMessage: e?.message || "Webhook processing failed.",
      });
    }
  },
});
