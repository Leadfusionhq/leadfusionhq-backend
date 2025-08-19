const express = require('express');
const ghlRouter = express.Router();
const GhlController = require('../controllers/ghl.controller.js');
const checkAuth = require('../middleware/check-auth');
const authorizedRoles = require('../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../helper/constant-enums.js');
const UserSchema = require('../request-schemas/user.schema.js');
const { celebrate } = require('celebrate');

const API = {

    ADD_SUB_ACCOUNT:'/create-subaccount/:userId',
    GET_SUB_ACCOUNTS:'/',
    
};
// ghlRouter.use(
//     checkAuth,
// );



ghlRouter.post(API.ADD_SUB_ACCOUNT, GhlController.createGHLSubAccount);
ghlRouter.get(API.GET_SUB_ACCOUNTS, GhlController.getSubAccounts);

module.exports = ghlRouter;
