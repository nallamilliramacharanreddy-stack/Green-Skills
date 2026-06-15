require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createUser() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills');
  
  let user = await User.findOne({ email: 'bandibswaroopa@gmail.com' });
  
  if (!user) {
    user = new User({
      name: 'Bandi B Swaroopa',
      email: 'bandibswaroopa@gmail.com',
      password: 'Satya@999',
      role: 'student'
    });
    await user.save();
    console.log('User created successfully with Satya@999');
  } else {
    user.password = 'Satya@999';
    await user.save();
    console.log('Password reset to Satya@999');
  }
  process.exit();
}
createUser();
