const { wrapAsync } = require('../utils/wrap-async');
const config = require('../config/config');
const { sendResponse } = require('../utils/response');
const { ErrorHandler } = require('../utils/error-handler');
const UserServices = require('../services/user.service');
const N8nServices = require('../services/n8n/n8n.automation.service');
const { syncUserToBoberdooById } = require('../services/boberdoo/boberdoo.service');
const MAIL_HANDLER = require('../mail/mails');
const CONSTANT_ENUM = require('../helper/constant-enums.js');

const getAllUsers = wrapAsync(async (req, res) => {
    const data = await UserServices.getAllUsersService(); 
    sendResponse(res, { data }, 'Users fetched successfully.', 200); 
});

const getAllAdmins = wrapAsync(async (req, res) => {
    const data = await UserServices.getAllAdminsService(); 
    sendResponse(res, { data }, 'Admin fetched successfully.', 200); 
});
const addUser = wrapAsync(async (req, res) => {
    const userPayload = req.body;
    const plainPassword = req.body.password;
    const { user } = await UserServices.addUserService(userPayload);

   
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

    sendResponse(res, { user }, 'User has been created. They can log in after verifying their account.', 201);
});


const getMyProfile = wrapAsync(async (req, res) => {
  const userId = req.user._id; // From auth middleware
  const user = await UserServices.getUserByID(userId);
  
  sendResponse(res, { user }, 'Profile fetched successfully.', 200);
});

const updateMyProfile = wrapAsync(async (req, res) => {
  const userId = req.user._id; // From auth middleware
  const updateData = req.body;

  console.log("🟢 [updateMyProfile] Incoming profile update request:");
  console.log("➡️ User ID:", userId);
  console.log("➡️ Raw update data:", updateData);

  // Users cannot update these fields themselves
  delete updateData.password;
  delete updateData.role;
  delete updateData.isEmailVerified;
  delete updateData.isActive;
  delete updateData.balance;
  delete updateData.refundMoney;
  delete updateData.n8nUserId;

  console.log("🧹 [updateMyProfile] Sanitized update data:", updateData);

  const updatedUser = await UserServices.updateUserProfile(userId, updateData);

  console.log("✅ [updateMyProfile] User updated successfully:", updatedUser);

  sendResponse(res, { user: updatedUser }, 'Profile updated successfully.', 200);
});


const changeMyPassword = wrapAsync(async (req, res) => {
  console.log('Incoming password change body:', req.body);

  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;
  
  await UserServices.changeUserPassword(userId, currentPassword, newPassword);
  
  sendResponse(res, {}, 'Password changed successfully. Please login again.', 200);
});

// ✅ Add this new controller
const uploadMyAvatar = wrapAsync(async (req, res) => {
  const userId = req.user._id; // Get from auth middleware

  if (!req.file) {
    return sendResponse(res, {}, "No file uploaded", 400);
  }

  const folder = "profile/user";
  const avatarPath = `/uploads/${folder}/${req.file.filename}`; // store without /public

  const user = await UserServices.getUserByID(userId, true);

  // Delete previous avatar
  if (user?.avatar) {
    const oldAvatarPath = path.join(process.cwd(), "public", user.avatar.replace(/^\/+/, ""));
    if (fs.existsSync(oldAvatarPath)) {
      fs.unlinkSync(oldAvatarPath);
    }
  }

  // Update user with new avatar
  const updatedUser = await UserServices.updateUserProfile(userId, { avatar: avatarPath });

  sendResponse(res, { user: updatedUser }, "Avatar uploaded successfully", 200);
});



const getUserById = wrapAsync(async (req, res) => {
    const { userId } = req.params;
    const data = await UserServices.getUserByID(userId); 
    sendResponse(res, { data }, 'Users fetched successfully.', 200); 
});

const updateUser = wrapAsync(async (req, res) => {
    const userPayload = req.body;
    // console.log('userPayload',userPayload)
    const { userId } = req.params;
    const plainPassword = req.body.password;
    const { user } = await UserServices.updateUser(userId,userPayload);


    sendResponse(res, { user }, 'User has been updated.', 201);
});

const deleteUser = wrapAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await UserServices.getUserByID(userId);
  if (!user) {
    return sendResponse(res, null, 'User not found.', 404);
  }

  if (user.n8nUserId) {
    try {
      await N8nServices.deleteSubAccountById(user.n8nUserId);
      console.log(`n8n user ${user.n8nUserId} deleted successfully.`);
    } catch (err) {
      console.error(`Failed to delete n8n user ${user.n8nUserId}:`, err.message);
    }
  }

  await UserServices.hardDeleteUser(userId);

  return sendResponse(res, null, 'User has been deleted.', 200);
});


const acceptContract = wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const { version, ipAddress } = req.body;
  
  const contractData = {
    version,
    ipAddress: ipAddress || req.ip // Get IP here in the controller
  };

  const updatedUser = await UserServices.updateContractAcceptance(userId, contractData);
  
  sendResponse(res, { 
    contractAcceptance: updatedUser.contractAcceptance 
  }, 'Contract accepted successfully.', 200);
});

// Get contract status
const getContractStatus = wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const { version } = req.query;
  
  if (version) {
    const hasAccepted = await UserServices.hasAcceptedContract(userId, version);
    sendResponse(res, { 
      hasAccepted,
      version 
    }, 'Contract status retrieved.', 200);
  } else {
    const contractData = await UserServices.getContractAcceptance(userId);
    sendResponse(res, { 
      contractAcceptance: contractData 
    }, 'Contract acceptance data retrieved.', 200);
  }
});

// Check if user has accepted current contract
const checkContractAcceptance = wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const { version } = req.body;
  
  const hasAccepted = await UserServices.hasAcceptedContract(userId, version);
  
  sendResponse(res, { 
    hasAccepted,
    requiresAcceptance: !hasAccepted 
  }, 'Contract acceptance check completed.', 200);
});

const resyncBoberdoo = wrapAsync(async (req, res) => {
  const { userId } = req.params;

  // Guard: allow self or admin
  if (
    req.user.role !== CONSTANT_ENUM.USER_ROLE.ADMIN &&
    String(req.user._id) !== String(userId)
  ) {
    throw new ErrorHandler(403, 'Forbidden');
  }

  const result = await syncUserToBoberdooById(userId);
  sendResponse(res, { result }, 'Boberdoo resync attempted', 200);
});
module.exports = {
 getAllUsers,
 getAllAdmins,
 addUser,
 getUserById,
 updateUser,
 deleteUser,
 acceptContract,
 getContractStatus,
 checkContractAcceptance,
 resyncBoberdoo,
 uploadMyAvatar,
 getMyProfile,
 updateMyProfile,
 changeMyPassword,
};
