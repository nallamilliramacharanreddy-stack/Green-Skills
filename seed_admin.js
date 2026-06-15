const mongoose = require('./server/node_modules/mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');
require('dotenv').config({ path: './server/.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills';

async function seedMasterAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('DB Connected for seeding...');

    const email = 'nallamilliramacharanreddy@gmail.com';
    const existing = await User.findOne({ email });

    if (existing) {
      console.log('Main Admin exists. Updating status...');
      existing.isAdminApproved = true;
      existing.role = 'admin';
      existing.isSuspended = false;
      await existing.save();
      console.log('Main Admin updated successfully.');
    } else {
      console.log('Main Admin NOT FOUND. Creating new account...');
      const admin = new User({
        name: 'Ramacharan Reddy',
        email: email,
        password: 'AdminPassword123!', // You should change this after login
        role: 'admin',
        isAdminApproved: true,
        isSuspended: false
      });
      await admin.save();
      console.log('Main Admin created successfully. Password: AdminPassword123!');
    }
  } catch (error) {
    console.error('Seeding Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedMasterAdmin();
