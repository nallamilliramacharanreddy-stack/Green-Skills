const mongoose = require('mongoose');
require('./models/User');
require('./models/Course');
const Result = require('./models/Result');

mongoose.connect('mongodb://localhost:27017/green_skills').then(async () => {
  const results = await Result.find().lean();
  console.log('Total Results:', results.length);
  results.forEach(r => {
    console.log(`Result ID: ${r._id}, raw userId: ${r.user}`);
  });
  process.exit(0);
});
