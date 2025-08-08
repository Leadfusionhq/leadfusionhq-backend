const express = require('express');
const locationRouter = express.Router();
const locationController = require('../../controllers/location/location.controllers');
const multer = require('multer');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');

const upload = multer({ storage: multer.memoryStorage() });

const API = {
  GET_ALL_LOCATIONS: '/',
  UPLOAD_CSV_DATA: '/upload-csv-data'
};
locationRouter.use(
    checkAuth,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN])
);

locationRouter.post( API.UPLOAD_CSV_DATA, upload.single('file'),  locationController.uploadCSVData);

locationRouter.get( API.GET_ALL_LOCATIONS, locationController.getAllLocationsDetailed);

module.exports = locationRouter;
