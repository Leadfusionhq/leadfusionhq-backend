const { wrapAsync } = require('../utils/wrap-async');
const config = require('../config/config');
const { sendResponse } = require('../utils/response');
const { ErrorHandler } = require('../utils/error-handler');
const UserServices = require('../services/user.service');
const N8nServices = require('../services/n8n.service');

const MAIL_HANDLER = require('../mail/mails');


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

module.exports = {
 getAllUsers,
 getAllAdmins,
 addUser,
 getUserById,
 updateUser,
 deleteUser,
};
