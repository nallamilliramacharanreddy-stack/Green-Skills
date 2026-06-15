const mongoose = require('mongoose');
require('./models/User');
const User = mongoose.model('User');
const Result = require('./models/Result');

mongoose.connect('mongodb://localhost:27017/green_skills').then(async () => {
  const user = await User.findOne({ email: /nallamilli/i });
  if (!user) {
    console.log("Rama not found");
    process.exit(0);
  }
  console.log("Rama ID:", user._id);
  const results = await Result.find({ user: user._id });
  console.log(`Found ${results.length} results for Rama`);
  process.exit(0);
});
