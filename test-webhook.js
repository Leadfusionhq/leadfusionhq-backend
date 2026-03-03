const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./src/models/user.model').User;

const API_BASE = 'http://localhost:5000/api'; // assuming port 5000

async function testWebhooks() {
  await mongoose.connect('mongodb+srv://LeadfusionAdmin:p%40ssw0rd123@cluster0.n1bje.mongodb.net/test?authSource=admin&replicaSet=atlas-2yv4kq-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true');
  
  // Find an admin to generate a token or bypass auth for testing (or we grab a real token)
  // For quick local tests, maybe we fetch an admin user and generate a token
  
  console.log("Connected to MongoDB.");
  
  // Get an admin user
  const admin = await User.findOne({ role: 'ADMIN' });
  if (!admin) {
    console.log("No admin found.");
    process.exit(1);
  }

  // Get a regular user
  const user = await User.findOne({ role: 'USER' });
  if (!user) {
    console.log("No user found.");
    process.exit(1);
  }
  
  // To hit the endpoint, we need an admin token. We can simulate it by importing and calling the controller directly or generating a token
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, require('./src/config/config').jwtSecret || 'secret', { expiresIn: '1h' });

  // 1. Test Low Balance Webhook
  try {
    console.log(`Testing low balance webhook for user ${user._id}`);
    const lowBalRes = await axios.post(`${API_BASE}/admin/${user._id}/low-balance-alert`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Low Balance webhook response:", lowBalRes.data);
  } catch (err) {
    console.error("Low Balance webhook error:", err.response ? err.response.data : err.message);
  }

  // 2. Test Top Up Webhook
  try {
    console.log(`Testing top up webhook for user ${user._id}`);
    const topUpRes = await axios.post(`${API_BASE}/admin/${user._id}/top-up-alert`, { amount: 50 }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Top Up webhook response:", topUpRes.data);
  } catch (err) {
    console.error("Top Up webhook error:", err.response ? err.response.data : err.message);
  }

  mongoose.disconnect();
}

testWebhooks();
