const config = require('../config/config');

// userController.js
exports.getAllUsers = (req, res) => {
    res.json({ message: 'All users fetched from controller!' });
};
