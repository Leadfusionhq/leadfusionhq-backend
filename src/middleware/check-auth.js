const UserServices = require('../services/user.service');
const config = require('../config/config');
const { ErrorHandler } = require('../utils/error-handler');
const { isEmpty } = require('../utils/utils');
const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (isEmpty(token)) {
      return next(new ErrorHandler(403, 'Token is missing'));
    }

    try {
      const decoded = jwt.verify(token, config.server.jwtSecretKey);
      const userExist = await UserServices.getUserByID(decoded.id, true);
      if (!userExist) {
        return next(new ErrorHandler(404, "Couldn't find your account, please create an account"));
      }

      req.user = userExist;
    } catch (err) {
      return next(
        new ErrorHandler(401, "Couldn't verify your identity, please try logging in again")
      );
    }
    next();
  } catch (err) {
    return next(new ErrorHandler(404, 'User account not found'));
  }
};
