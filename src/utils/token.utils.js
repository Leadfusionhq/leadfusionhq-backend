const crypto = require('crypto');

function generateVerificationToken(size = 32) {
  return crypto.randomBytes(size).toString('hex');
}

function getTokenExpiration(hours) {
  return new Date(Date.now() + hours * 3600000);
}

module.exports = {
  generateVerificationToken,
  getTokenExpiration,
};
