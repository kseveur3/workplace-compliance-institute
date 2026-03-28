// Entry point for the renewal reminder job.
// Intended for use by the Heroku scheduler (or any cron runner).
// Usage: node scripts/run-renewal-job.js

import "dotenv/config";
import { runRenewalJob } from "../renewal-job.js";

runRenewalJob()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[run-renewal-job] Fatal error:", err);
    process.exit(1);
  });
