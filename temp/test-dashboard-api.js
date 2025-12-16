require('dotenv').config();
const mongoose = require('mongoose');
const DashboardService = require('../src/services/dashboard.service');

async function testDashboardStats() {
    try {
        console.log('Connecting to DB...');
        await require('../src/config/mongoose').connect();

        console.log('Fetching Stats for 30d...');
        const stats30d = await DashboardService.getDashboardStats({ range: '30d' });
        console.log('Stats 30d:', JSON.stringify(stats30d, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Done');
        process.exit();
    }
}

testDashboardStats();
