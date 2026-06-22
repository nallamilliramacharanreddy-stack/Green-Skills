const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  facialEmbedding: { type: String },
  role: {
    type: String,
    enum: ['student', 'employer', 'admin', 'admin_course', 'admin_hiring', 'admin_exam', 'guide', 'support'],
    default: 'student'
  },
  isSuspended: { type: Boolean, default: false },
  isAdminApproved: { type: Boolean, default: false },
  quizScores: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number,
    totalQuestions: Number,
    completedAt: { type: Date, default: Date.now }
  }],
  age: Number,
  education: String,
  mobile: String,
  skillsInterested: [String],
  preferredLanguage: String,
  currentWork: String,
  careerGoal: String,
  sustainabilityScore: { type: Number, default: 0 },
  badges: [{
    name: String,
    icon: String,
    awardedAt: { type: Date, default: Date.now }
  }],
  roadmap: {
    recommendedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    nextSteps: [String],
    timeline: String
  },
  companyDetails: {
    companyName: String,
    registrationNumber: String,
    companyDocument: String,
    verificationStatus: { type: String, enum: ['red', 'yellow', 'green'], default: 'red' },
    isVerified: { type: Boolean, default: false }
  },
  progress: {
    completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    currentCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    courseProgress: [{
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      completedLessons: [Number], // array of lesson indices
      completedTasks: [Number] // array of task indices
    }]
  },
  suspensionRequest: {
    status: { type: String, enum: ['none', 'pending'], default: 'none' },
    requestedAt: Date
  },
  profilePicture: { type: String, default: '' },
  
  // -- ADVANCED LEARNING ENHANCEMENTS & ANALYTICS --
  learningStreak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: Date
  },
  aiAnalytics: {
    skillGaps: [String],
    recommendedPath: [String],
    aiScore: { type: Number, default: 0 }
  },
  certifications: [{
    courseName: String,
    certificateUrl: String,
    issuedAt: { type: Date, default: Date.now }
  }],
  notes: [{
    topic: String,
    content: String,
    audioUrl: String, // Voice notes
    aiSummary: String,
    createdAt: { type: Date, default: Date.now }
  }],
  // ------------------------------------------------

  // -- ULTRA 3D STREAK & LEADERBOARD SYSTEM --
  ultraStreak: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    leaderboardPoints: { type: Number, default: 0 },
    lastActiveTimestamp: { type: Date },
    streakHistory: [{ date: { type: Date, default: Date.now }, action: String }],
    rewardHistory: [{ date: { type: Date, default: Date.now }, reward: String, xpAmount: Number }],
    badgeInventory: [{ badgeName: String, unlockedAt: { type: Date, default: Date.now }, rarity: String }],
    streakMilestoneProgress: { type: Number, default: 0 }
  },

  // -- ADMIN OTP --
  adminOtp: { type: String },
  adminOtpExpires: { type: Date },

  // -- EMPLOYER OTP --
  employerOtp: { type: String },
  employerOtpExpires: { type: Date },

  // -- RESET PASSWORD OTP --
  resetPasswordOtp: { type: String },
  resetPasswordOtpExpires: { type: Date },

  // -- USER NOTES --
  notes: [{
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],

  // -- ADVANCED MODULE TRACKING --
  sustainabilityScore: { type: Number, default: 0 },
  hiringReadiness: { type: Number, default: 0 },
  careerGoals: { type: String },
  preferences: {
    preferredSector: { type: String },
    jobType: { type: String, enum: ['remote', 'onsite', 'hybrid'] }
  },

  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
