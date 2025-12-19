const express = require('express');
const userRouter = express.Router();
const UserController = require('../controllers/user.controllers');
const checkAuth = require('../middleware/check-auth');
const authorizedRoles = require('../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../helper/constant-enums.js');
const UserSchema = require('../request-schemas/user.schema.js');
const { celebrate } = require('celebrate');
const createUpload = require("../middleware/upload");

const API = {
    GET_ALL_USERS: '/',
    ADD_USER: '/',
    GET_USER_BY_ID: '/:userId',
    UPDATE_USER: '/:userId',
    DELETE_USER_BY_ID: '/:userId',
    TOGGLE_USER_STATUS_BY_ID: '/:userId/toggle-status',

    // User self-service routes
    GET_MY_PROFILE: '/me/profile',
    UPDATE_MY_PROFILE: '/me/profile',
    CHANGE_MY_PASSWORD: '/me/change-password',
    UPLOAD_MY_AVATAR: '/me/avatar',

    ACCEPT_CONTRACT: '/:userId/contract/accept',
    GET_CONTRACT_STATUS: '/:userId/contract/status',
    CHECK_CONTRACT: '/:userId/contract/check',
    SYNC_BOMBERDO: '/:userId/boberdoo/resync',
    SEND_BALANCE_TOPUP_WEBHOOK: '/:userId/balance/topup-webhook',
    VERIFY_EMAIL: '/:userId/verify-email',

};

// Apply authentication to all routes
userRouter.use(checkAuth);

// Get current user's profile
userRouter.get(API.GET_MY_PROFILE,
    UserController.getMyProfile
);

// Update current user's profile
userRouter.put(API.UPDATE_MY_PROFILE,
    celebrate(UserSchema.updateMyProfile),
    UserController.updateMyProfile
);

// Change current user's password
userRouter.put(API.CHANGE_MY_PASSWORD,
    celebrate(UserSchema.changePassword),
    UserController.changeMyPassword
);

const uploadUser = createUpload("profile/user");
userRouter.patch(API.UPLOAD_MY_AVATAR, uploadUser.single("avatar"), UserController.uploadMyAvatar);


// Test route first
userRouter.get('/test-route', (req, res) => {
    res.json({ message: 'User routes are working!' });
});

// Admin-only routes
userRouter.get(API.GET_ALL_USERS,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]),
    UserController.getAllUsers
);

userRouter.post(API.ADD_USER,
    celebrate(UserSchema.createUserByAdmin),
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]),
    UserController.addUser
);

userRouter.get(API.GET_USER_BY_ID,
    celebrate(UserSchema.getUserById),
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]),
    UserController.getUserById
);

userRouter.put(API.UPDATE_USER,
    celebrate(UserSchema.updateUser),
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]),
    UserController.updateUser
);

userRouter.patch(API.TOGGLE_USER_STATUS_BY_ID,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]),
    UserController.toggleUserStatus
);

userRouter.delete(API.DELETE_USER_BY_ID,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]),
    UserController.deleteUser
);

// Contract routes - Allow both admin and users
userRouter.put(API.ACCEPT_CONTRACT,
    celebrate(UserSchema.acceptContract),
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN, CONSTANT_ENUM.USER_ROLE.USER]),
    UserController.acceptContract
);

userRouter.get(API.GET_CONTRACT_STATUS,
    celebrate(UserSchema.getContractStatus),
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN, CONSTANT_ENUM.USER_ROLE.USER]),
    UserController.getContractStatus
);

userRouter.post(API.CHECK_CONTRACT,
    celebrate(UserSchema.checkContract),
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN, CONSTANT_ENUM.USER_ROLE.USER]),
    UserController.checkContractAcceptance
);
// below existing imports and middlewares
userRouter.post(
    API.SYNC_BOMBERDO,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN, CONSTANT_ENUM.USER_ROLE.USER]),
    UserController.resyncBoberdoo
);

// below existing SYNC_BOMBERDO route
userRouter.post(
    API.SEND_BALANCE_TOPUP_WEBHOOK,
    authorizedRoles([
        CONSTANT_ENUM.USER_ROLE.ADMIN,
        CONSTANT_ENUM.USER_ROLE.USER
    ]),
    UserController.sendBalanceTopUpWebhook
);

// Admin verify user email route
userRouter.post(API.VERIFY_EMAIL,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]),
    UserController.verifyUserEmail
);

userRouter.delete(API.DELETE_USER_BY_ID,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]),
    UserController.deleteUser
);

module.exports = userRouter;