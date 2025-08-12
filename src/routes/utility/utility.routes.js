const express = require('express');
const utilityRouter = express.Router();
const UtilityController = require('../../controllers/utility/utility.controller.js');
const multer = require('multer');
const checkAuth = require('../../middleware/check-auth.js');
const authorizedRoles = require('../../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const LocationSchema = require('../../request-schemas/location.schema.js');
const { celebrate } = require('celebrate');


const API = {
  ADD_UTILITY: '/',
  ADD_UTILITY_BULK: '/bulk',
  GET_UITILITIES_BY_STATE: '/state/:stateId',

};
utilityRouter.use(
    checkAuth,
    // authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN], [CONSTANT_ENUM.USER_ROLE.USER])
);

utilityRouter.post( API.ADD_UTILITY, UtilityController.createUtility);

utilityRouter.post( API.ADD_UTILITY_BULK, UtilityController.bulkCreateUtilities);

utilityRouter.get( API.GET_UITILITIES_BY_STATE, UtilityController.getUtilitiesByState);

module.exports = utilityRouter;
