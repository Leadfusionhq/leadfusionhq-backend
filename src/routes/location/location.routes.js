const express = require('express');
const locationRouter = express.Router();
const locationController = require('../../controllers/location/location.controllers');
const multer = require('multer');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const LocationSchema = require('../../request-schemas/location.schema.js');
const { celebrate } = require('celebrate');


const upload = multer({ storage: multer.memoryStorage() });

const API = {
  GET_ALL_LOCATIONS: '/',
  UPLOAD_CSV_DATA: '/upload-csv-data',
  GET_STATES: '/states',
  GET_COUNTIES_BY_STATE: '/states/:stateId/counties'

};
locationRouter.get( API.GET_STATES, locationController.getAllStates);
locationRouter.use(
    checkAuth,
    // authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN], [CONSTANT_ENUM.USER_ROLE.USER])
);

locationRouter.post( API.UPLOAD_CSV_DATA, upload.single('file'),  locationController.uploadCSVData);

locationRouter.get( API.GET_ALL_LOCATIONS, locationController.getAllLocationsDetailed);



locationRouter.get( API.GET_COUNTIES_BY_STATE, celebrate(LocationSchema.getCountiesByState), locationController.getCountiesByState);


module.exports = locationRouter;
