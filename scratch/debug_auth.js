require('dotenv').config();
const { google } = require('googleapis');

const email = process.env.SERVICE_EMAIL;
let key = process.env.GOOGLE_PRIVATE_KEY;

console.log('Original Key Length:', key?.length);
if (key) {
    key = key.trim().replace(/^"/, '').replace(/"$/, '').replace(/\\n/g, '\n');
}
console.log('Cleaned Key Length:', key?.length);
console.log('Key summary:', JSON.stringify(key?.substring(0, 50)));

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function testAuth() {
    try {
        console.log('Testing JWT Auth with options object...');
        const auth = new google.auth.JWT({
            email: email,
            key: key,
            scopes: SCOPES
        });
        await auth.authorize();
        console.log('Auth Success!');
    } catch (err) {
        console.error('Auth Failed:', err.message);
        console.log('Error object:', JSON.stringify(err));
    }
}

testAuth();
