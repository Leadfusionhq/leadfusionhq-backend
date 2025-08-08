const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const { ErrorHandler } = require('../../utils/error-handler');
const csv = require('csv-parser');
const stream = require('stream');
const LocationServices = require('../../services/location/location.service');

const uploadCSVData = wrapAsync(async (req, res) => {
  const file = req.file;

  if (!file) throw new ErrorHandler(400, 'No file uploaded');

  const rows = [];
  const bufferStream = new stream.PassThrough();
  bufferStream.end(file.buffer);

  bufferStream
    .pipe(csv())
    .on('data', (row) => rows.push(row))
    .on('end', async () => {
      const result = await LocationServices.uploadCSVData(rows);
      sendResponse(res, result, 'CSV data uploaded and processed successfully', 200);
    })
    .on('error', (err) => {
      throw new ErrorHandler(500, `CSV Parsing Error: ${err.message}`);
    });
});
const previewCSVData = wrapAsync(async (req, res) => {
  const file = req.file;

  if (!file) {
    throw new ErrorHandler(400, 'No file uploaded');
  }

  const results = [];
  const MAX_ROWS = 10; // Limit rows to 10

  const bufferStream = new stream.PassThrough();
  bufferStream.end(file.buffer);

  bufferStream
    .pipe(csv())
    .on('data', (row) => {
      if (results.length < MAX_ROWS) {
        results.push(row);
      } else {
        bufferStream.destroy();
      }
    })
    .on('end', () => {
      sendResponse(res, { data: results }, `CSV preview (max ${MAX_ROWS} rows)`, 200);
    })
    .on('error', (err) => {
      throw new ErrorHandler(500, `CSV Parsing Error: ${err.message}`);
    });
});
module.exports = {
  uploadCSVData,
  previewCSVData,
};
