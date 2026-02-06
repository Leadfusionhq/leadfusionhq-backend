const MAIL_HANDLER = require('../../mail/mails');
const { billingLogger } = require('../../utils/logger');

/**
 * Sends a lead payment receipt email.
 * Decoupled from BillingServices to avoid circular dependencies.
 */
async function sendLeadPaymentReceipt({
    user,
    lead,
    campaign,
    billingResult
}) {
    try {
        billingLogger.info('DEBUG: Entering sendLeadPaymentReceipt (Decoupled Service)', { userId: user?._id, leadId: lead?.lead_id });

        const leadCost = lead.lead_cost || campaign.bid_price || 0;
        const leadName = `${lead.first_name} ${lead.last_name}`.trim();
        const full_address = lead.address?.full_address || "N/A";

        await MAIL_HANDLER.sendLeadPaymentEmail({
            to: user.email,
            userName: user.name,
            leadCost: leadCost,
            leadId: lead.lead_id,
            leadName: leadName,
            campaignName: campaign.name,
            payment_type: campaign.payment_type,
            full_address: full_address,
            transactionId: billingResult.transactionId,
            newBalance: billingResult.newBalance,
            amountFromBalance: billingResult.amountFromBalance,
            amountFromCard: billingResult.amountFromCard,
            leadData: {
                first_name: lead.first_name,
                last_name: lead.last_name,
                phone_number: lead.phone_number,
                email: lead.email,
                address: lead.address
            }
        });

        billingLogger.info('Lead payment receipt email sent', {
            userId: user._id,
            leadId: lead.lead_id,
            transactionId: billingResult.transactionId
        });

        return { success: true };
    } catch (err) {
        billingLogger.error('Failed to send lead payment receipt email', err, {
            userId: user?._id,
            leadId: lead?.lead_id
        });
        return { success: false, error: err.message };
    }
}

module.exports = {
    sendLeadPaymentReceipt
};
