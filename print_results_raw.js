const mongoose = require('./server/node_modules/mongoose');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = 'mongodb://127.0.0.1:27017/green_skills';

async function printResultsRaw() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  const db = mongoose.connection.db;
  const results = await db.collection('results').find().sort({ completedAt: -1 }).limit(3).toArray();
  console.log(JSON.stringify(results, null, 2));

  await mongoose.disconnect();
}

printResultsRaw();
