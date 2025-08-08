const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const UserServices = require('../../services/user.service');
const { ErrorHandler } = require('../../utils/error-handler');
const { randomNumberGenerate, isEmpty } = require('../../utils/utils');

const createCampaign = wrapAsync(async (req, res) => {
    const data = req.body;

    sendResponse(res, { data }, 'campaign has been create succefully', 201);
});

module.exports = {
    createCampaign,
     
};
