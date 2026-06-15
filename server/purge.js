const mongoose = require('mongoose');
const Job = require('./models/Job');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills';

async function purge() {
  await mongoose.connect(MONGO_URI);
  const res = await Job.deleteMany({ companyName: { $in: ['EcoPower Solutions', 'GreenEarth Agri'] } });
  console.log(`Deleted ${res.deletedCount} default jobs.`);
  process.exit(0);
}

purge();
