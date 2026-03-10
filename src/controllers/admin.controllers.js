const { wrapAsync } = require('../utils/wrap-async');
const config = require('../config/config');
const { sendResponse } = require('../utils/response');
const { ErrorHandler } = require('../utils/error-handler');
const UserServices = require('../services/user.service');
const N8nServices = require('../services/n8n/n8n.automation.service');
const { getPaginationParams, extractFilters } = require('../utils/pagination');

const AdminServices = require('../services/admin.service');
const { addBalanceByAdmin } = require('../services/billing/billing.service')
const MAIL_HANDLER = require('../mail/mails');
const fs = require("fs");
const path = require("path");
const { sendLowBalanceAlert, sendBalanceTopUpAlertByAdmin } = require('../services/n8n/webhookService.js');
const { billingLogger } = require('../utils/logger');
const Campaign = require('../models/campaign.model');
const Log = require('../models/Log');

// const getAllAdmins = wrapAsync(async (req, res) => {
//   const data = await UserServices.getAllAdminsService();
//   sendResponse(res, { data }, 'Admin fetched successfully.', 200);
// });

const getAllAdmins = wrapAsync(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);

  const allowedFilterKeys = ['company', 'status', 'email', 'isEmailVerified', 'isActive', 'state'];
  const filters = extractFilters(req.query, allowedFilterKeys);
  const search = req.query.search || "";
  const result = await UserServices.getAllAdminsService(page, limit, filters, search);
  sendResponse(res, result, 'Admin fetched successfully.', 200);
});

const addAdmin = wrapAsync(async (req, res) => {
  const userPayload = req.body;
  const plainPassword = req.body.password;
  const { user } = await AdminServices.addAdminService(userPayload);


  try {
    await MAIL_HANDLER.sendAccountCreationEmailWithVerification({
      to: user.email,
      name: user.name,
      token: user.verificationToken,
      password: plainPassword,
    });
  } catch (err) {
    console.error('Error sending account creation email:', err);
  }

  sendResponse(res, { user }, 'Admin has been created. They can log in after verifying their account.', 201);
});


const getAdminById = wrapAsync(async (req, res) => {
  const { adminId } = req.params;
  const data = await AdminServices.getAdminByID(adminId);
  sendResponse(res, { data }, 'Admin fetched successfully.', 200);
});

const updateAdmin = wrapAsync(async (req, res) => {
  const userPayload = req.body;
  const { adminId } = req.params;
  const plainPassword = req.body.password;

  const { user } = await AdminServices.updateAdmin(adminId, userPayload);

  sendResponse(res, { user }, 'Admin has been updated.', 201);
});
const deleteAdmin = wrapAsync(async (req, res) => {
  const { adminId } = req.params;

  const user = await AdminServices.getAdminByID(adminId);
  if (!user) {
    return sendResponse(res, null, 'Admin not found.', 404);
  }
  if (user.n8nUserId) {
    try {
      await N8nServices.deleteSubAccountById(user.n8nUserId);
      console.log(`n8n user ${user.n8nUserId} deleted successfully.`);
    } catch (err) {
      console.error(`Failed to delete n8n user ${user.n8nUserId}:`, err.message);
    }
  }
  await AdminServices.hardDeleteAdmin(adminId);

  return sendResponse(res, null, 'Admin has been deleted.', 200);
});


const uploadAvatarAdmin = wrapAsync(async (req, res) => {
  const { adminId } = req.params;

  if (!req.file) {
    return sendResponse(res, {}, "No file uploaded", 400);
  }

  const folder = "profile/admin";
  const avatarPath = `/uploads/${folder}/${req.file.filename}`; // store without /public

  const user = await AdminServices.getAdminByID(adminId);

  // Delete previous avatar
  if (user?.avatar) {
    const oldAvatarPath = path.join(process.cwd(), "public", user.avatar.replace(/^\/+/, ""));
    if (fs.existsSync(oldAvatarPath)) {
      fs.unlinkSync(oldAvatarPath);
    }
  }

  // Update user with new avatar
  const updatedUser = await AdminServices.updateAdmin(adminId, { avatar: avatarPath });

  sendResponse(res, { user: updatedUser }, "Avatar uploaded successfully", 200);
});

const addUserBalance = wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;
  const adminId = req.user.id;

  const result = await addBalanceByAdmin(userId, amount, adminId);

  sendResponse(res, result, result.message, 200);

});

const triggerLowBalanceWebhook = wrapAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await UserServices.getUserByID(userId);
  if (!user) {
    throw new ErrorHandler(404, 'User not found');
  }

  // Fetch all campaigns for the user to get all associated filter set IDs
  const campaigns = await Campaign.find({
    user_id: user._id,
    boberdoo_filter_set_id: { $exists: true, $ne: null }
  });
  // Get unique filter set IDs
  const filterSetIds = [...new Set(campaigns.map(c => c.boberdoo_filter_set_id))].filter(Boolean);
  const filter_set_id_value = filterSetIds.length > 0 ? filterSetIds.join(',') : null;

  const partner_id = user.integrations?.boberdoo?.external_id || null;
  billingLogger.info("Admin manually triggering Low Balance webhook", { user_id: user._id, partner_id });

  const result = await sendLowBalanceAlert({
    partner_id,
    email: user.email,
    user_id: user._id,
    campaign_name: 'Manual Admin Trigger',
    filter_set_id: filter_set_id_value,
    campaign_id: null
  });

  sendResponse(res, { result }, 'Low balance webhook triggered manually', 200);
});

const triggerBalanceTopUpWebhook = wrapAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await UserServices.getUserByID(userId);
  if (!user) {
    throw new ErrorHandler(404, 'User not found');
  }

  const partner_id = user.integrations?.boberdoo?.external_id || null;
  billingLogger.info("Admin manually triggering Balance Top-Up webhook", { user_id: user._id, partner_id });

  const result = await sendBalanceTopUpAlertByAdmin({
    partner_id,
    email: user.email,
    amount: user.balance,
    user_id: user._id
  });

  if (result?.success === true) {
    user.payment_error = false;
    user.last_payment_error_message = null;
    await user.save();
  }

  sendResponse(res, { result }, 'Balance top-up webhook triggered manually', 200);
});

const getUserLogs = wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = getPaginationParams(req.query);
  const search = req.query.search || '';

  const query = {
    $or: [
      { userId: userId },
      { 'metadata.userId': userId },
      { 'metadata.user_id': userId }
    ]
  };

  if (search) {
    query.$and = [
      {
        $or: [
          { message: { $regex: search, $options: 'i' } },
          { level: { $regex: search, $options: 'i' } },
          { logType: { $regex: search, $options: 'i' } },
          { module: { $regex: search, $options: 'i' } }
        ]
      }
    ];
  }

  const skip = (page - 1) * limit;

  const data = await Log.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalLogs = await Log.countDocuments(query);
  const totalPages = Math.ceil(totalLogs / limit);

  const result = {
    data,
    pagination: {
      page,
      limit,
      total: totalLogs,
      pages: totalPages,
    }
  };

  sendResponse(res, result, 'User logs fetched successfully.', 200);
});

module.exports = {
  getAllAdmins,
  addAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  uploadAvatarAdmin,
  addUserBalance,
  triggerLowBalanceWebhook,
  triggerBalanceTopUpWebhook,
  getUserLogs,
};
