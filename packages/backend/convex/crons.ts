import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run SLA checks every 15 minutes
crons.interval(
  "check-sla-breaches",
  { minutes: 15 }, // every 15 minutes
  internal.system.sla.checkSlas,
);

// Run web crawl re-crawl check every hour
crons.interval(
  "recrawl-due-jobs",
  { hours: 1 },
  internal.private.crawl.recrawlDueJobs,
  {},
);

// Process Outbox every minute
crons.interval(
  "process-outbox",
  { minutes: 1 },
  internal.channels.base.outbox.processOutbox,
);

// Sync all integrations every hour
crons.interval(
  "sync-integrations",
  { hours: 1 },
  (internal as any).integrations.base.actions.syncAllIntegrations,
);

export default crons;

