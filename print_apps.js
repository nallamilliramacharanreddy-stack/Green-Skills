const mongoose = require('mongoose');
const Application = require('./server/models/Application');
const User = require('./server/models/User');
require('dotenv').config({ path: './server/.env' });

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // Find all applications
    const apps = await Application.find({}).populate('studentId').populate('employerId');
    
    console.log('--- ALL APPLICATIONS ---');
    for (let app of apps) {
      console.log(`Application ID: ${app._id}`);
      console.log(`Status: ${app.status}`);
      console.log(`Student Name: ${app.studentId?.name || 'MISSING'}`);
      console.log(`Student Email: ${app.studentId?.email || 'MISSING'}`);
      console.log(`Employer Name: ${app.employerId?.name || 'MISSING'}`);
      console.log(`Employer Email: ${app.employerId?.email || 'MISSING'}`);
      console.log('------------------------');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
