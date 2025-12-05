const cron = require("node-cron");
const Lead = require("../models/lead.model");
const LeadServices = require("../services/lead/lead.service");
const { leadLogger } = require("../utils/logger");

module.exports = () => {
  // Runs every minute (for testing)
  cron.schedule("* * * * *", async () => {
    const logMeta = {
      module: "CRON_AUTO_REJECT_RETURN",
      triggered_at: new Date(),
    };

    try {
      leadLogger.info("Checking expired return leads to auto-reject...", logMeta);

      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

      // Find all pending leads older than 5 days
      const expiredLeads = await Lead.find({
        return_status: "Pending",
        updatedAt: { $lte: fiveDaysAgo },
      });

      leadLogger.info(`Found ${expiredLeads.length} expired return requests`, {
        ...logMeta,
        expired_count: expiredLeads.length,
      });

      for (const lead of expiredLeads) {
        await LeadServices.rejectReturnLead(lead._id, "Rejected");

        leadLogger.info("Auto-rejected return lead", {
          ...logMeta,
          lead_id: lead._id,
        });
      }

      leadLogger.info(
        "Auto-reject cron job completed successfully",
        logMeta
      );

    } catch (err) {
      leadLogger.error(
        "Error auto-rejecting expired returned leads",
        err,
        {
          ...logMeta,
          error: err?.message,
          stack: err?.stack,
        }
      );
    }
  });
};
