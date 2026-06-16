const mongoose = require('./server/node_modules/mongoose');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = 'mongodb://127.0.0.1:27017/green_skills';

async function listCollections() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const coll of collections) {
    const count = await db.collection(coll.name).countDocuments();
    console.log(`Collection: ${coll.name} - Count: ${count}`);
  }

  await mongoose.disconnect();
  console.log('Disconnected');
}

listCollections();
