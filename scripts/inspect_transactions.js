
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const DB_URL = process.env.MONGO_URI || process.env.DB_URL;
console.log('Connecting to:', DB_URL ? 'DB_URL found' : 'DB_URL NOT FOUND');

const modelPath = path.resolve(__dirname, '..', 'src', 'models', 'transaction.model.js');
console.log('Attempting to require model from:', modelPath);
// Use dynamic require
let Transaction;
try {
    Transaction = require(modelPath);
    console.log('Transaction model loaded');
} catch (e) {
    console.error('Failed to require transaction model:', e);
    process.exit(1);
}

mongoose.connect(DB_URL)
    .then(async () => {
        console.log('Connected to DB');

        try {
            console.log('--- Fetching latest 10 transactions ---');
            const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10).lean();

            if (transactions.length === 0) {
                console.log('No transactions found in DB at all.');
            } else {
                console.log(`Found ${transactions.length} total transactions.`);
                transactions.forEach(t => {
                    // Serialize ObjectId if possible
                    const cleanUserId = t.userId ? t.userId.toString() : 'NULL';
                    console.log(`ID: ${t._id}, UserID: ${cleanUserId} (Raw Type: ${typeof t.userId}), Amount: ${t.amount}, Type: ${t.type}, Created: ${t.createdAt}`);
                });
            }

            console.log('--- Checking for specific user ---');
            const specificUserId = '6888640ec3c908b7bf1ae501'; // User from logs
            const userTransactions = await Transaction.find({ userId: specificUserId }).limit(5).lean();
            console.log(`Query { userId: "${specificUserId}" } -> Found: ${userTransactions.length}`);

            // Try ObjectId explicit
            try {
                const oid = new mongoose.Types.ObjectId(specificUserId);
                const userTransactionsOID = await Transaction.find({ userId: oid }).limit(5).lean();
                console.log(`Query { userId: ObjectId("${specificUserId}") } -> Found: ${userTransactionsOID.length}`);
            } catch (err) {
                console.log('Invalid ObjectId conversion:', err.message);
            }

        } catch (err) {
            console.error('Error querying DB:', err);
        } finally {
            await mongoose.connection.close();
            console.log('Disconnected');
        }
    })
    .catch(err => {
        console.error('DB Connection Error:', err);
    });
