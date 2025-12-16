const mongoose = require('mongoose');
const { User } = require('../models/user.model');
const Lead = require('../models/lead.model');
const Campaign = require('../models/campaign.model');
const { STATUS } = require('../helper/constant-enums');

class DashboardService {

    async getDashboardStats(query = {}) {
        const { range = '30d' } = query;

        const totalUsers = await User.countDocuments({});

        const totalLeads = await Lead.countDocuments({});



        let daysToSubtract = 30;
        if (range === '7d') daysToSubtract = 7;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysToSubtract);
        startDate.setHours(0, 0, 0, 0);

        const matchStage = {
            createdAt: { $gte: startDate }
        };

        const aggregationPipeline = [
            { $match: matchStage },
            {
                $project: {
                    formattedDate: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    status: 1,
                    return_status: 1
                }
            },
            {
                $group: {
                    _id: "$formattedDate",
                    qualified: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$status", "active"] },
                                        { $eq: ["$return_status", "Not Returned"] } // Only count as qualified if NOT returned
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    disqualified: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ifNull: ["$return_status", false] },
                                        { $ne: ["$return_status", "Not Returned"] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ];

        const chartDataRaw = await Lead.aggregate(aggregationPipeline);

        // 4. Detailed User Stats
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = await User.countDocuments({ isActive: false });

        // 5. Detailed Lead Stats (Global)
        // Fix: Active leads should exclude those that are "Returned" to avoid double counting
        const activeLeads = await Lead.countDocuments({
            status: 'active',
            return_status: { $in: ['Not Returned', null] }
        });

        const returnedLeads = await Lead.countDocuments({
            return_status: { $in: ['Pending', 'Approved', 'Rejected'] }
        });

        // 6. Campaign Stats
        const totalCampaigns = await Campaign.countDocuments({});
        const activeCampaigns = await Campaign.countDocuments({ status: STATUS.ACTIVE });
        const pendingCampaigns = await Campaign.countDocuments({ status: STATUS.PENDING });

        const leadChartData = this.fillMissingDates(chartDataRaw, daysToSubtract);

        return {
            totalUsers,
            activeUsers,
            inactiveUsers,

            totalLeads,
            activeLeads,
            returnedLeads,

            totalCampaigns,
            activeCampaigns,
            pendingCampaigns,

            leadChartData
        };
    }

    fillMissingDates(data, days) {
        const filledData = [];
        const dataMap = new Map(data.map(item => [item._id, item]));

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            let name;
            if (days <= 7) {
                name = d.toLocaleDateString('en-US', { weekday: 'short' });
            } else {
                name = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            const existing = dataMap.get(dateStr);

            filledData.push({
                name,
                qualified: existing ? existing.qualified : 0,
                disqualified: existing ? existing.disqualified : 0,
                date: dateStr
            });
        }

        return filledData;
    }
}

module.exports = new DashboardService();
