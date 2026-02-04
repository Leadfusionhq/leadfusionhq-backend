const mongoose = require('mongoose');
const { User } = require('../models/user.model');
const Lead = require('../models/lead.model');
const Campaign = require('../models/campaign.model');
const Transaction = require('../models/transaction.model');
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

    getDateRange(range = '7d') {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        switch (range) {
            case 'today':
                break;
            case 'yesterday':
                start.setDate(start.getDate() - 1);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case '7d':
                start.setDate(start.getDate() - 6);
                break;
            case '30d':
                start.setDate(start.getDate() - 29);
                break;
            case 'this_month':
                start.setDate(1);
                break;
            case 'last_month':
                start.setMonth(start.getMonth() - 1);
                start.setDate(1);
                end.setDate(0); // Last day of previous month
                end.setHours(23, 59, 59, 999);
                break;
            default: // 7d default
                start.setDate(start.getDate() - 6);
        }
        return { start, end };
    }

    async getRecentActivity(userId) {
        // Fetch recent items from different collections
        const [recentLeads, recentTransactions, recentCampaigns] = await Promise.all([
            Lead.find({ user_id: userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('campaign_id', 'name'),
            Transaction.find({ user_id: userId })
                .sort({ createdAt: -1 })
                .limit(5),
            Campaign.find({ user_id: userId })
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        const activities = [];

        // Map Leads
        recentLeads.forEach(lead => {
            activities.push({
                id: lead._id,
                type: 'lead',
                message: `New lead from ${lead.first_name} ${lead.last_name}`,
                timestamp: lead.createdAt
            });
            // If lead is returned
            if (lead.return_status === 'Approved') {
                activities.push({
                    id: `${lead._id}_return`,
                    type: 'lead_return',
                    message: `Lead return approved for ${lead.first_name}`,
                    timestamp: lead.updatedAt // Approximation
                });
            }
        });

        // Map Transactions
        recentTransactions.forEach(tx => {
            let message = '';
            if (tx.type === 'ADD_FUNDS' && tx.status === 'COMPLETED') {
                message = `Added $${tx.amount} to balance`;
            } else if (tx.type === 'DEDUCTION') {
                message = `Spent $${tx.amount} on leads`;
            } else {
                message = `Transaction ${tx.type}: $${tx.amount}`;
            }
            activities.push({
                id: tx._id,
                type: 'payment',
                message: message,
                timestamp: tx.createdAt
            });
        });

        // Map Campaigns
        recentCampaigns.forEach(camp => {
            activities.push({
                id: camp._id,
                type: 'campaign',
                message: `Campaign "${camp.name}" created`,
                timestamp: camp.createdAt
            });
        });

        // Merge, Sort, Limit
        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
    }

    async getUserDashboardStats(userId, range = '7d') {
        const { start, end } = this.getDateRange(range);

        // Date range for charts - defaulting to 7 days for trend consistency, 
        // OR we can make it match the range. 
        // User requested: "leads_trend: [ ... ]" in 'charts'.
        // Let's keep it as last 7 days visual for now, or adapt.
        // If range is 'today', a 7-day chart is still useful context.
        // If range is '30d', we might want 30 data points.
        // Let's stick to 7 days for the chart to keep it simple unless requested otherwise.
        const chartStart = new Date();
        chartStart.setDate(chartStart.getDate() - 6);
        chartStart.setHours(0, 0, 0, 0);

        const [
            user,
            summaryMetrics,
            chartData,
            recentLeads,
            lastPayment,
            campaignPerformance,
            recentActivity,
            billingStats
        ] = await Promise.all([
            User.findById(userId),
            Lead.aggregate([
                { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
                {
                    $facet: {
                        // Total Leads (Filtered by Range)
                        totalLeadsFiltered: [
                            { $match: { createdAt: { $gte: start, $lte: end } } },
                            { $count: "count" }
                        ],
                        // Global Lead Metrics (Status is current state, not range bound usually) <--- This seems to be the part to change
                        leadMetrics: [
                            { $match: { createdAt: { $gte: start, $lte: end } } },
                            {
                                $group: {
                                    _id: null,
                                    active: {
                                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                                    },
                                    pending_return: {
                                        $sum: { $cond: [{ $eq: ["$return_status", "Pending"] }, 1, 0] }
                                    },
                                    returned: {
                                        $sum: { $cond: [{ $eq: ["$return_status", "Approved"] }, 1, 0] }
                                    },
                                    rejected_return: {
                                        $sum: { $cond: [{ $eq: ["$return_status", "Rejected"] }, 1, 0] }
                                    },
                                    payment_pending: {
                                        $sum: { $cond: [{ $eq: ["$status", "payment_pending"] }, 1, 0] }
                                    }
                                }
                            }
                        ],
                        // Global Pending Balance (All Time)
                        globalPendingBalance: [
                            {
                                $match: {
                                    payment_status: 'pending'
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: "$lead_cost" }
                                }
                            }
                        ]
                    }
                }
            ]),
            // Charts: Last 7 Days (Fixed for trend visualization)
            Lead.aggregate([
                {
                    $match: {
                        user_id: new mongoose.Types.ObjectId(userId),
                        createdAt: { $gte: chartStart }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Recent Leads List (Top 5 Global)
            Lead.find({ user_id: userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('campaign_id', 'name'),
            // Last Payment
            Transaction.findOne({
                userId: userId,
                type: { $in: ['ADD_FUNDS', 'ADMIN_ADD_FUNDS'] },
                status: { $in: ['COMPLETED', 'SUCCESS'] }
            }).sort({ createdAt: -1 }),
            // Campaign Stats
            Campaign.aggregate([
                { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
                {
                    $facet: {
                        // Summary Counts
                        counts: [
                            {
                                $group: {
                                    _id: null,
                                    // Total Campaigns (Global / All-Time)
                                    total: { $sum: 1 },
                                    active: { $sum: { $cond: [{ $eq: ["$status", STATUS.ACTIVE] }, 1, 0] } },
                                    completed: { $sum: { $cond: [{ $in: ["$status", [STATUS.PAUSED, STATUS.REJECTED]] }, 1, 0] } }
                                }
                            }
                        ],
                        topCampaigns: [
                            {
                                $lookup: {
                                    from: 'leads',
                                    localField: '_id',
                                    foreignField: 'campaign_id',
                                    as: 'leads'
                                }
                            },
                            {
                                $project: {
                                    name: 1,
                                    status: 1,
                                    total_leads: { $size: "$leads" },
                                    converted_leads: {
                                        $size: {
                                            $filter: {
                                                input: "$leads",
                                                as: "lead",
                                                cond: { $eq: ["$$lead.status", "converted"] }
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                $project: {
                                    name: 1,
                                    status: 1,
                                    total_leads: 1,
                                    conversion_rate: {
                                        $cond: [
                                            { $gt: ["$total_leads", 0] },
                                            {
                                                $multiply: [
                                                    { $divide: ["$converted_leads", "$total_leads"] },
                                                    100
                                                ]
                                            },
                                            0
                                        ]
                                    }
                                }
                            },
                            { $sort: { total_leads: -1 } },
                            { $limit: 5 }
                        ]
                    }
                }
            ]),
            // Recent Activity Feed
            this.getRecentActivity(userId),
            // Billing Stats (Filtered by Range)
            Transaction.aggregate([
                {
                    $match: {
                        user_id: new mongoose.Types.ObjectId(userId), // Transaction schema uses 'userId' string or ObjectId? Model says ObjectId ref User.
                        // Wait, Transaction model has 'userId' (camelCase). Check schema.
                        // Checked schema: userId: { type: ObjectId, ref: 'User' }. Correct.
                        // But wait, my previous code used `Transaction.findOne({ userId: userId ... })`.
                        // The aggregate needs proper field name.
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: null,
                        spent: {
                            $sum: {
                                $cond: [
                                    { $in: ["$type", ["DEDUCTION", "LEAD_ASSIGNMENT"]] },
                                    "$amount",
                                    0
                                ]
                            }
                        },
                        added: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $in: ["$type", ["ADD_FUNDS", "ADMIN_ADD_FUNDS"]] },
                                            { $in: ["$status", ["COMPLETED", "SUCCESS"]] }
                                        ]
                                    },
                                    "$amount",
                                    0
                                ]
                            }
                        }
                    }
                }
            ])
        ]);

        const leadMetrics = summaryMetrics[0]?.leadMetrics[0] || {
            active: 0,
            pending_return: 0,
            returned: 0,
            rejected_return: 0,
            payment_pending: 0
        };

        const campaignStats = campaignPerformance[0]?.counts[0] || {
            total: 0,
            active: 0,
            completed: 0
        };

        const billingPeriodStats = billingStats[0] || { spent: 0, added: 0 };

        // Fill missing dates for chart
        const filledChartData = [];
        const chartMap = new Map(chartData.map(item => [item._id, item.count]));
        for (let i = 6; i >= 0; i--) {
            const d = new Date(chartStart); // Use chartStart base
            d.setDate(d.getDate() + (6 - i)); // Iterate forward
            // Or simpler:
            const d2 = new Date();
            d2.setDate(d2.getDate() - i);
            const dateStr = d2.toISOString().split('T')[0];
            filledChartData.push({
                date: dateStr,
                count: chartMap.get(dateStr) || 0
            });
        }

        return {
            success: true,
            data: {
                summary: {
                    total_leads: summaryMetrics[0]?.totalLeadsFiltered[0]?.count || 0,
                    total_campaigns: campaignStats.total,
                    active_campaigns: campaignStats.active,
                    completed_campaigns: campaignStats.completed
                },
                lead_metrics: {
                    active: leadMetrics.active,
                    pending_return: leadMetrics.pending_return,
                    returned: leadMetrics.returned,
                    rejected_return: leadMetrics.rejected_return,
                    payment_pending: leadMetrics.payment_pending
                },
                billing: {
                    current_balance: user?.balance || 0,
                    pending_balance: summaryMetrics[0]?.globalPendingBalance[0]?.total || 0,
                    currency: user?.currency || 'USD',
                    spent_this_period: billingPeriodStats.spent,
                    added_this_period: billingPeriodStats.added,
                    is_low_balance: (user?.balance || 0) < 100,
                    last_payment: lastPayment ? {
                        amount: lastPayment.amount,
                        date: lastPayment.createdAt
                    } : null
                },
                charts: {
                    leads_trend: filledChartData // Renamed from leads_last_7_days as per request context
                },
                recent_activity: recentActivity,
                recent_leads: recentLeads.map(lead => ({
                    id: lead._id,
                    name: `${lead.first_name} ${lead.last_name}`,
                    campaign_name: lead.campaign_id?.name || 'N/A',
                    status: lead.status,
                    payment_status: lead.payment_status,
                    created_at: lead.createdAt
                })),
                campaign_performance: campaignPerformance[0]?.topCampaigns.map(camp => ({
                    id: camp._id,
                    name: camp.name,
                    total_leads: camp.total_leads,
                    conversion_rate: parseFloat(camp.conversion_rate.toFixed(2)),
                    status: camp.status
                }))
            }
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
