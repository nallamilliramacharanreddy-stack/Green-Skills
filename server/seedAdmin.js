const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills';

const seedMasterAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'nallamilliramacharanreddy@gmail.com';
    const password = 'Reddy@3377';

    // Remove existing if any
    await User.findOneAndDelete({ email });

    const masterAdmin = new User({
      name: 'Master Admin',
      email: email,
      password: password, // Will be hashed by pre-save hook
      role: 'admin',
      isAdminApproved: true
    });

    await masterAdmin.save();
    console.log('Master Admin seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedMasterAdmin();
