const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const BillingServices = require('../../services/billing/billing.service.js');
const { ErrorHandler } = require('../../utils/error-handler');
const { getPaginationParams , extractFilters} = require('../../utils/pagination');



const saveCard = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const cardData = { ...req.body, user_id };

    try {
        const data = await BillingServices.saveCard(cardData);
        return sendResponse(res, { data }, 'Your card details have been saved', 201);
    } catch (err) {
        console.error(`Failed to save card:`, err.message);
        throw new ErrorHandler(500, 'Failed to save your card details. Please try again later.');
    }
});

module.exports = {
    saveCard,
    
};
