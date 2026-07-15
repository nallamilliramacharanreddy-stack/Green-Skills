const mongoose = require('mongoose');
const Application = require('./server/models/Application');
require('dotenv').config({ path: './server/.env' });

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // Find all applications where the student applied to their own job
    const apps = await Application.find({});
    let deletedCount = 0;
    
    for (let app of apps) {
      if (app.studentId && app.employerId && app.studentId.toString() === app.employerId.toString()) {
        console.log('Deleting test application where student == employer:', app._id);
        await Application.findByIdAndDelete(app._id);
        deletedCount++;
      }
    }
    
    console.log(`Deleted ${deletedCount} test applications.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
