require('dotenv').config({ path: './server/.env' });
const mongoose = require('./server/node_modules/mongoose');
const bcrypt = require('./server/node_modules/bcryptjs');
const User = require('./server/models/User');

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/green_skills');
    console.log('Connected to MongoDB');

    const email = 'nallamilliramacharanreddy@gmail.com';
    const newPassword = 'AdminPassword123!';

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Admin user NOT FOUND. Creating...');
      const newUser = new User({
        name: 'Ramacharan Reddy',
        email,
        password: newPassword,
        role: 'admin',
        isAdminApproved: true,
        isSuspended: false
      });
      await newUser.save();
      console.log('Admin created with password: AdminPassword123!');
    } else {
      console.log('Found user:', user.email, 'role:', user.role);
      console.log('Current hashed password:', user.password);
      
      // Directly update password using bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);
      await User.findOneAndUpdate({ email }, { 
        password: hashed,
        isAdminApproved: true,
        isSuspended: false,
        role: 'admin'
      });
      console.log('Password reset to: AdminPassword123!');
      
      // Verify
      const updated = await User.findOne({ email });
      const isMatch = await bcrypt.compare(newPassword, updated.password);
      console.log('Password verification:', isMatch ? '✅ SUCCESS' : '❌ FAILED');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

resetAdminPassword();
