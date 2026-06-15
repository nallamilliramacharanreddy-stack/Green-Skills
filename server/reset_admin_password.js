require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function resetAdminPassword() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/green_skills';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB:', uri);

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
      console.log('✅ Admin created with password: AdminPassword123!');
    } else {
      console.log('Found user:', user.email, '| Role:', user.role, '| Approved:', user.isAdminApproved);
      
      // Reset password
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);
      await User.findOneAndUpdate({ email }, { 
        password: hashed,
        isAdminApproved: true,
        isSuspended: false,
        role: 'admin'
      });
      
      // Verify
      const updated = await User.findOne({ email });
      const isMatch = await bcrypt.compare(newPassword, updated.password);
      console.log('Password reset to: AdminPassword123!');
      console.log('Verification:', isMatch ? '✅ SUCCESS - Login should work now' : '❌ FAILED');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetAdminPassword();
