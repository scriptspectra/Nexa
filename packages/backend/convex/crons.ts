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

export default crons;

