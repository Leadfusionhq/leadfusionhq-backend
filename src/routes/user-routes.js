const express = require('express');
const userRouter = express.Router();
const UserController = require('../controllers/user.controllers');
const checkAuth = require('../middleware/check-auth');
const authorizedRoles = require('../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../helper/constant-enums.js');
const UserSchema = require('../request-schemas/user.schema.js');
const { celebrate } = require('celebrate');

const API = {
    GET_ALL_USERS: '/',
    ADD_USER: '/',
    GET_USER_BY_ID:'/:userId',
    UPDATE_USER:'/:userId',
    DELETE_USER_BY_ID:'/:userId',

    ACCEPT_CONTRACT: '/:userId/contract/accept',
    GET_CONTRACT_STATUS: '/:userId/contract/status',
    CHECK_CONTRACT: '/:userId/contract/check'
};

// Apply authentication to all routes
userRouter.use(checkAuth);

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

module.exports = userRouter;