const mongoose = require('./server/node_modules/mongoose');
const User = require('./server/models/User');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/green_skills';

async function checkUser() {
  console.log('Connecting to:', MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');
  } catch (err) {
    console.error('Failed to connect:', err);
    process.exit(1);
  }
  const user = await User.findOne({ email: 'nallamilliramacharanreddy@gmail.com' });
  console.log('Main Admin Status:', user ? {
    email: user.email,
    role: user.role,
    isAdminApproved: user.isAdminApproved,
    isSuspended: user.isSuspended
  } : 'NOT FOUND');

  const allUsers = await User.find().select('email role isAdminApproved');
  console.log('All Users:', allUsers);

  await mongoose.disconnect();
}

checkUser();
