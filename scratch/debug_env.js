require('dotenv').config();
const email = process.env.SERVICE_EMAIL;
const key = process.env.GOOGLE_PRIVATE_KEY;

console.log('Email:', email);
console.log('Key length:', key?.length);
console.log('Key starts with:', key?.substring(0, 20));
console.log('Key ends with:', key?.substring(key?.length - 20));

if (key && key.startsWith('"') && key.endsWith('"')) {
  console.log('Detected quotes wrapping the key!');
}

const cleanedKey = key?.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1');
console.log('Cleaned Key start:', cleanedKey?.substring(0, 20));
