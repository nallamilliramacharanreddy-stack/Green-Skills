const mongoose = require('mongoose');
require('./models/User');
const User = mongoose.model('User');

mongoose.connect('mongodb://localhost:27017/green_skills').then(async () => {
  const user = await User.findOne({ email: 'bandibswaroopa@gmail.com' });
  const userResponse = user.toObject();
  delete userResponse.password;
  
  // This is what goes into localStorage
  const savedUserStr = JSON.stringify(userResponse);
  
  // This is what the frontend does
  const savedUser = JSON.parse(savedUserStr);
  const currentUserId = (savedUser?.id || savedUser?._id)?.toString();
  
  console.log("Stringified:", savedUserStr);
  console.log("Parsed user:", savedUser);
  console.log("Evaluated currentUserId:", currentUserId);
  process.exit(0);
});
