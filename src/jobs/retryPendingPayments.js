const cron = require("node-cron");
const BillingServices = require("../services/billing/billing.service");
const { billingLogger } = require("../utils/logger");

/**
 * Automated Pending Payment Retry Cron Job
 *
 * Schedule: Every 12 hours (6 AM & 6 PM server time)
 * Override: Set CRON_RETRY_SCHEDULE env variable for testing
 *
 * Safety:
 * - Max 5 users per run (rate limiting)
 * - 3s delay between users (NMI gateway protection)
 * - Overlap guard (skips if previous run still active)
 * - Per-user error isolation (one failure does not stop others)
 */
module.exports = () => {
    const schedule = process.env.CRON_RETRY_SCHEDULE || "0 6,18 * * *";

    billingLogger.info(`[CRON_RETRY] Registering payment retry cron with schedule: ${schedule}`);

    cron.schedule(schedule, async () => {
        const logMeta = {
            module: "CRON_RETRY_PAYMENTS",
            triggered_at: new Date(),
        };

        try {
            billingLogger.info("[CRON_RETRY] Cron triggered — starting payment retry", logMeta);

            const result = await BillingServices.cronRetryPendingPayments();

            billingLogger.info("[CRON_RETRY] Cron run finished", {
                ...logMeta,
                result,
            });
        } catch (err) {
            billingLogger.error("[CRON_RETRY] Unhandled error in cron job", err, {
                ...logMeta,
                error: err?.message,
                stack: err?.stack,
            });
        }
    });

    billingLogger.info("[CRON_RETRY] Payment retry cron job registered successfully");
};
