const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const authGuard = require('../middleware/check-auth');

router.get('/stats', DashboardController.getStats);
router.get('/user-stats', authGuard, DashboardController.getUserStats);

module.exports = router;
