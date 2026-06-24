const mongoose = require('mongoose');
const Certificate = require('./server/models/Certificate');

// Check the index.js or config to find the MongoDB URI
// In index.js, let's see what the MONGO_URI is or use default
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/green_skills';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');
    const certs = await Certificate.find({});
    console.log('All Certificates:');
    certs.forEach(c => {
      console.log(`ID: ${c.certificateId} | UserID: ${c.userId} | Candidate: ${c.candidateName} | Course: ${c.courseName}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
