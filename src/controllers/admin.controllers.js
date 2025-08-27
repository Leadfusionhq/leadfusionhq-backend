const { wrapAsync } = require('../utils/wrap-async');
const config = require('../config/config');
const { sendResponse } = require('../utils/response');
const { ErrorHandler } = require('../utils/error-handler');
const UserServices = require('../services/user.service');
const N8nServices = require('../services/n8n/n8n.automation.service');

const AdminServices = require('../services/admin.service');

const MAIL_HANDLER = require('../mail/mails');
const fs = require("fs");
const path = require("path");

const getAllAdmins = wrapAsync(async (req, res) => {
    const data = await UserServices.getAllAdminsService(); 
    sendResponse(res, { data }, 'Admin fetched successfully.', 200); 
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

    const { user } = await AdminServices.updateAdmin(adminId,userPayload);

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






module.exports = {
 getAllAdmins,
 addAdmin,
 getAdminById,
 updateAdmin,
 deleteAdmin,
 uploadAvatarAdmin,
};
