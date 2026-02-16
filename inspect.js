
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const DB_URL = "mongodb+srv://Leadfusionhq:Leadfusionhq@leadfusionhq.yxmprq.mongodb.net/db_staging?retryWrites=true&w=majority&appName=leadfusionhq";

const modelPath = path.resolve(__dirname, 'src', 'models', 'transaction.model.js');
let Transaction;
try {
    Transaction = require(modelPath);
} catch (e) {
    process.exit(1);
}

const outputFile = path.resolve(__dirname, 'inspect_output.txt');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(outputFile, msg + '\n');
};

if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);

mongoose.connect(DB_URL)
    .then(async () => {
        log('Connected to DB');

        try {
            log('--- Fetching latest 10 transactions ---');
            const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10).lean();

            if (transactions.length === 0) {
                log('No transactions found in DB at all.');
            } else {
                log(`Found ${transactions.length} total transactions.`);

                // Use JSON.stringify for clarity on structure
                transactions.forEach(t => {
                    log(`Raw Transaction: ${JSON.stringify(t)}`);
                });
            }

        } catch (err) {
            log(`Error: ${err.message}`);
        } finally {
            await mongoose.connection.close();
            log('Disconnected');
        }
    })
    .catch(err => {
        log(`Connection Error: ${err.message}`);
    });
