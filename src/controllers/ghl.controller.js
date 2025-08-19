const GHLService = require('../services/ghl.service');
const { ErrorHandler } = require('../utils/error-handler');
const { sendResponse } = require('../utils/response');
const { wrapAsync } = require('../utils/wrap-async');
const config = require('../config/config');
const UserServices = require('../services/user.service');

const createGHLSubAccount = wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await UserServices.getUserByID(userId);

  if (!user.isEmailVerified) {
    throw new ErrorHandler(400, 'User email is not verified. Cannot create GHL sub-account.');
  }

  if (user.ghlLocationId) {
    return sendResponse(res, { ghlLocationId: user.ghlLocationId }, 'GHL sub-account already exists.', 200);
  }


  const ghlRes = await GHLService.createSubAccount({
    firstName: user.name,
    lastName : 'ghl',
    businessName: user.companyName || user.name || 'Test Business',
    email: user.email,
    phone: user.phoneNumber || '',
    address: user.address || '123 Default St',
    city: user.region || 'Default City',
    state: user.state || 'NY',
    postalCode: user.zipCode || '10001',
    country: user.country || 'US',  
    timezone: 'America/New_York',   
  });

//   await UserServices.updateUser(userId, {
//     ghlLocationId: ghlRes.id,
//   });

  sendResponse(res, { ghlLocationId: ghlRes.id }, 'GHL sub-account created successfully.', 201);
});

const getSubAccounts = wrapAsync(async (req, res) => {
  const data = await GHLService.getSubAccounts();

 
  sendResponse(res, data, 'GHL sub-account fetched successfully.', 201);
});
module.exports = {
    createGHLSubAccount,
    getSubAccounts,
};
