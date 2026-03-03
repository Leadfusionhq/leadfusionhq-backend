const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://LeadfusionAdmin:p%40ssw0rd123@cluster0.n1bje.mongodb.net/test?authSource=admin&replicaSet=atlas-2yv4kq-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test'); // Replace with correct DB if needed, but it seems to be test or leadfusion
    const admins = await db.collection('users').find({role: 'ADMIN'}).limit(1).toArray();
    const users = await db.collection('users').find({role: 'USER'}).limit(1).toArray();
    
    if(admins.length > 0) console.log("ADMIN_ID=" + admins[0]._id);
    if(users.length > 0) console.log("USER_ID=" + users[0]._id);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
