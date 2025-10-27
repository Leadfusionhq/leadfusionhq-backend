const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateToken = (id, role, expiresIn) => {
  return jwt.sign({ id, role }, config.server.jwtSecretKey, {
    expiresIn,
  });
};
function generateResetToken(userId) {
  const payload = { userId };
  return jwt.sign(payload, config.server.jwtSecretKey, { expiresIn: '15m' });
}
const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.server.jwtSecretKey);
    return decoded.userId;
  } catch (err) {
    return null;
  }
};
module.exports = {
  generateToken,
  generateResetToken,
  verifyResetToken,
};
