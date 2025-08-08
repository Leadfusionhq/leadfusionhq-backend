const express = require('express');
const locationRouter = express.Router();
const locationController = require('../../controllers/location/location.controllers');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const API = {
  UPLOAD_CSV_DATA: '/upload-csv-data'
};

locationRouter.post(
  API.UPLOAD_CSV_DATA,
  upload.single('file'), 
  locationController.uploadCSVData
);

module.exports = locationRouter;
