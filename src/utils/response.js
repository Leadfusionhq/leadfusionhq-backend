const sendResponse = (res, payload, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    ...payload,
    message
  });
};

module.exports = {
  sendResponse,
};
