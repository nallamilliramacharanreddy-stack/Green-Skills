const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills';

mongoose.connect(dbUri)
  .then(async () => {
    console.log("Connected to MongoDB");
    const certSchema = new mongoose.Schema({}, { strict: false });
    const Certificate = mongoose.model('Certificate', certSchema, 'certificates');
    const User = mongoose.model('User', certSchema, 'users');

    const certs = await Certificate.find({});
    console.log(`Found ${certs.length} certificates:`);
    for (const cert of certs) {
      console.log(`ID: ${cert.get('certificateId')}, Course: ${cert.get('courseName')}, Candidate: ${cert.get('candidateName')}, UserId: ${cert.get('userId')}`);
    }

    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    for (const u of users) {
      console.log(`User: ${u.get('name')}, Email: ${u.get('email')}, Id: ${u._id}`);
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
  });
