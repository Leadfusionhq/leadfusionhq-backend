const mongoose = require('mongoose');
const { User } = require('../models/user.model');
const Lead = require('../models/lead.model');
const Campaign = require('../models/campaign.model');
const { STATUS } = require('../helper/constant-enums');

class DashboardService {

    async getDashboardStats(query = {}) {
        const { range = '30d' } = query;

        let daysToSubtract = 30;
        if (range === '7d') daysToSubtract = 7;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysToSubtract);
        startDate.setHours(0, 0, 0, 0);

        // Helper to extract count from facet result safely
        const getCount = (arr) => (arr && arr.length > 0 && arr[0].count) ? arr[0].count : 0;

        const [userResults, leadResults, campaignResults] = await Promise.all([
            User.aggregate([
                {
                    $facet: {
                        totalUsers: [{ $count: "count" }],
                        activeUsers: [{ $match: { isActive: true } }, { $count: "count" }],
                        inactiveUsers: [{ $match: { isActive: false } }, { $count: "count" }],
                        activeAdmins: [
                            {
                                $match: {
                                    isActive: true,
                                    role: { $in: [STATUS.ADMIN, 'ADMIN', 'SUPER_ADMIN', /^admin$/i, /^super_admin$/i] }
                                }
                            },
                            { $count: "count" }
                        ],
                        activeRegularUsers: [
                            {
                                $match: {
                                    isActive: true,
                                    isEmailVerified: true,
                                    role: { $in: ['USER', /^user$/i] }
                                }
                            },
                            { $count: "count" }
                        ],
                        unverifiedUsers: [
                            { $match: { isEmailVerified: false } },
                            { $count: "count" }
                        ]
                    }
                }
            ]),
            Lead.aggregate([
                {
                    $facet: {
                        totalLeads: [{ $count: "count" }],
                        activeLeads: [
                            {
                                $match: {
                                    status: 'active',
                                    return_status: { $in: ['Not Returned', null] }
                                }
                            },
                            { $count: "count" }
                        ],
                        returnedLeads: [
                            {
                                $match: {
                                    return_status: { $in: ['Pending', 'Approved', 'Rejected'] }
                                }
                            },
                            { $count: "count" }
                        ],
                        chartData: [
                            { $match: { createdAt: { $gte: startDate } } },
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
                                                        { $eq: ["$return_status", "Not Returned"] }
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
                        ]
                    }
                }
            ]),
            Campaign.aggregate([
                {
                    $facet: {
                        totalCampaigns: [{ $count: "count" }],
                        activeCampaigns: [{ $match: { status: STATUS.ACTIVE } }, { $count: "count" }],
                        pendingCampaigns: [{ $match: { status: STATUS.PENDING } }, { $count: "count" }]
                    }
                }
            ])
        ]);

        const u = userResults[0];
        const l = leadResults[0];
        const c = campaignResults[0];

        const leadChartData = this.fillMissingDates(l.chartData, daysToSubtract);

        return {
            totalUsers: getCount(u.totalUsers),
            activeUsers: getCount(u.activeUsers),
            inactiveUsers: getCount(u.inactiveUsers),

            activeAdmins: getCount(u.activeAdmins),
            activeRegularUsers: getCount(u.activeRegularUsers),
            unverifiedUsers: getCount(u.unverifiedUsers),

            totalLeads: getCount(l.totalLeads),
            activeLeads: getCount(l.activeLeads),
            returnedLeads: getCount(l.returnedLeads),

            totalCampaigns: getCount(c.totalCampaigns),
            activeCampaigns: getCount(c.activeCampaigns),
            pendingCampaigns: getCount(c.pendingCampaigns),

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
