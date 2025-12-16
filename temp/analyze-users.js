require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const { User } = require('../src/models/user.model');

async function analyzeUsers() {
    try {
        await require('../src/config/mongoose').connect();

        const roles = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);

        const activeRoles = await User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);

        const verification = await User.aggregate([
            { $group: { _id: "$isEmailVerified", count: { $sum: 1 } } }
        ]);

        const activeUnverified = await User.countDocuments({ isActive: true, isEmailVerified: false });

        const output = `
Roles Distribution:
${JSON.stringify(roles, null, 2)}

Active Users by Role:
${JSON.stringify(activeRoles, null, 2)}

Verification Distribution:
${JSON.stringify(verification, null, 2)}

Active & Unverified: ${activeUnverified}
`;

        fs.writeFileSync('temp/analysis-results.txt', output);

    } catch (err) {
        fs.writeFileSync('temp/analysis-results.txt', 'Error: ' + err.message);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

analyzeUsers();
