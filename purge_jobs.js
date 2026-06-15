const mongoose = require('./server/node_modules/mongoose');
const Job = require('./server/models/Job');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills';

async function purgeJobs() {
  try {
    await mongoose.connect(MONGO_URI);
    const result = await Job.deleteMany({ 
      companyName: { $in: ['EcoPower Solutions', 'GreenEarth Agri'] } 
    });
    console.log(`Successfully purged ${result.deletedCount} default jobs.`);
  } catch (error) {
    console.error('Purge Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

purgeJobs();
