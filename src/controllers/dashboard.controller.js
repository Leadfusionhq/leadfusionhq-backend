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
}

module.exports = new DashboardController();
