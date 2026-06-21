import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run SLA checks every 15 minutes
crons.interval(
  "check-sla-breaches",
  { minutes: 15 }, // every 15 minutes
  internal.system.sla.checkSlas,
);

export default crons;
