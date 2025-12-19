const DashboardService = require('../services/dashboard.service');

class DashboardController {
    async getStats(req, res, next) {
        try {
            const { range } = req.query; // '7d', '30d', 'mtd'
            const stats = await DashboardService.getDashboardStats({ range });

            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    async getUserStats(req, res, next) {
        try {
            const userId = req.user._id;
            const { range } = req.query;
            const stats = await DashboardService.getUserDashboardStats(userId, range);

            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DashboardController();
