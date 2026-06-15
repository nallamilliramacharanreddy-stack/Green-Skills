const User = require('../models/User');
const Course = require('../models/Course');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to resolve IPv4 addresses first to bypass IPv6 DNS resolution issues on Render
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4, // Force IPv4 to bypass Render's lack of IPv6 support
  auth: {
    user: 'nallamilliramacharanreddy@gmail.com',
    pass: 'lmvy oszf cixi rvpj'
  }
});

const generatePremiumEmail = (otp) => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; font-weight: 900;">
        <span style="color: #34d399;">🌱 GREEN SKILL</span> <span style="color: #ffffff;">RURAL</span>
      </h1>
      <p style="color: #a7f3d0; font-size: 12px; letter-spacing: 4px; margin-top: 8px; text-transform: uppercase;">Admin Portal</p>
    </div>
    <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
      <h2 style="color: #064e3b; margin-top: 0; font-size: 20px;">Authentication Required</h2>
      <p style="color: #475569; line-height: 1.6; font-size: 15px;">An attempt was made to access the Green Skill Rural Admin Dashboard. To proceed with secure authorization, please use the following One-Time Password (OTP):</p>
      <div style="background: linear-gradient(to right, #f0fdf4, #dcfce7, #f0fdf4); padding: 25px; border-radius: 8px; border: 1px solid #bbf7d0; text-align: center; margin: 30px 0;">
        <span style="font-size: 36px; font-weight: 900; color: #064e3b; letter-spacing: 8px;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This secure code will expire in 3 minutes. If you did not initiate this login request, please secure your account immediately.</p>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <p style="color: #94a3b8; font-size: 12px; font-weight: 500;">© ${new Date().getFullYear()} Green Skill Rural. All rights reserved.</p>
    </div>
  </div>
`;

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

const signup = async (req, res) => {
  try {
    const { name, email, password, role, ...profileData } = req.body;

    // Strict Email Validation
    const emailRegex = /^[a-z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email must be in small letters and end with @gmail.com' });
    }

    // Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must contain uppercase, lowercase, number, and special character.' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Handle Multiple Files
    let profilePicPath = undefined;
    let companyDocPath = undefined;
    
    if (req.files) {
      if (req.files['profilePicture']) {
        profilePicPath = `/uploads/${req.files['profilePicture'][0].filename}`;
      }
      if (req.files['companyDocument']) {
        companyDocPath = `/uploads/${req.files['companyDocument'][0].filename}`;
      }
    } else if (req.file) {
      // Fallback for older singular uploads
      profilePicPath = `/uploads/${req.file.filename}`;
    }

    // Prepare company details
    const companyDetails = {
      companyName: profileData.companyName,
      registrationNumber: profileData.registrationNumber,
      companyDocument: companyDocPath,
      verificationStatus: 'red',
      isVerified: false
    };

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      ...profileData,
      companyDetails: role === 'employer' ? companyDetails : undefined,
      profilePicture: profilePicPath
    });

    await user.save();

    // Roles requiring approval
    const needsApproval = role === 'admin' || role === 'employer';
    
    // Create token ONLY for roles that don't need approval
    const token = !needsApproval ? jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' }) : null;

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: needsApproval 
        ? 'Registration successful. Your account is awaiting admin approval.' 
        : 'User registered successfully',
      token,
      user: token ? userResponse : null,
      needsApproval
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email })
      .populate('progress.currentCourses')
      .populate('progress.completedCourses');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify role match
    if (role && user.role !== role) {
      return res.status(403).json({ message: `Access denied. This account is registered as ${user.role}.` });
    }

    if (user.isSuspended) {
      return res.status(403).json({ 
        message: 'ACCOUNT SUSPENDED. Permission required to login.', 
        isSuspended: true,
        requestStatus: user.suspensionRequest?.status || 'none'
      });
    }

    // Role-based Access Control for Admin and Employer
    if (user.role === 'admin') {
      const MAIN_ADMIN = 'nallamilliramacharanreddy@gmail.com';
      if (user.email !== MAIN_ADMIN && !user.isAdminApproved) {
        return res.status(403).json({ message: 'ACCESS DENIED: Your account requires approval from the Main Admin to log in.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate OTP and send email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.adminOtp = otp;
      user.adminOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      const mailOptions = {
        from: '"Nexus Security" <nallamilliramacharanreddy@gmail.com>',
        to: user.email,
        subject: 'Nexus Admin Authentication - Security OTP',
        html: generatePremiumEmail(otp)
      };

      console.log(`[SECURITY] Admin Login OTP generated for ${user.email}: ${otp}`);
      try {
        await transporter.sendMail(mailOptions);
        return res.json({ requiresOtp: true, email: user.email, message: 'Security OTP sent to your email.' });
      } catch (err) {
        console.error('Error sending OTP email (gracefully handled):', err);
        return res.json({ requiresOtp: true, email: user.email, message: 'Security OTP generated (retrieve from console logs).' });
      }
    }

    if (user.role === 'employer') {
      // Hirers can login but will see a "Pending" screen in the frontend if not approved
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Admin Controllers
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllHirers = async (req, res) => {
  try {
    const hirers = await User.find({ role: 'employer' }).select('-password');
    res.json(hirers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isAdminApproved: true }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveHirer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id, 
      { 
        isAdminApproved: true,
        'companyDetails.isVerified': true,
        'companyDetails.verificationStatus': 'green'
      }, 
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectHirer = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: 'Hirer application rejected and removed.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isSuspended } = req.body;
    
    const userToUpdate = await User.findById(id);
    if (userToUpdate && userToUpdate.email === 'nallamilliramacharanreddy@gmail.com') {
      return res.status(403).json({ message: 'STRICT PROTOCOL: Master Admin cannot be suspended.' });
    }

    const user = await User.findByIdAndUpdate(id, { isSuspended }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToDelete = await User.findById(id);
    if (userToDelete && userToDelete.email === 'nallamilliramacharanreddy@gmail.com') {
      return res.status(403).json({ message: 'STRICT PROTOCOL: Master Admin cannot be removed from the system.' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ role: 'student' })
      .select('name quizScores sustainabilityScore progress')
      .lean();
    
    const leaderboard = users.map(u => {
      const avgQuizScore = u.quizScores.length > 0 
        ? u.quizScores.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / u.quizScores.length 
        : 0;
      const progress = u.progress?.completedCourses?.length || 0;
      return {
        _id: u._id,
        name: u.name,
        score: (avgQuizScore * 50) + (progress * 10), // Weighted score
        progress: progress
      };
    }).sort((a, b) => b.score - a.score);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestReactivation = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.suspensionRequest = {
      status: 'pending',
      requestedAt: new Date()
    };
    await user.save();
    res.json({ message: 'Re-activation request sent to Admin.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const handleSuspensionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'accept') {
      user.isSuspended = false;
      user.suspensionRequest.status = 'none';
    } else {
      user.suspensionRequest.status = 'none';
    }
    
    await user.save();
    res.json({ message: `Suspension request ${action}ed successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, age, education, skillsInterested, preferredLanguage, currentWork, careerGoal } = req.body;

    // Strict Email Validation (If email is being updated)
    if (email) {
      const emailRegex = /^[a-z0-9._%+-]+@gmail\.com$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Email must be in small letters and end with @gmail.com' });
      }
    }
    
    let updateData = { 
      name, email, mobile, age, education, 
      preferredLanguage, currentWork, careerGoal 
    };

    if (req.body.password && req.body.password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    if (skillsInterested) {
      updateData.skillsInterested = typeof skillsInterested === 'string' 
        ? skillsInterested.split(',').map(s => s.trim()) 
        : skillsInterested;
    }
    
    if (req.file) {
      updateData.profilePicture = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true })
      .populate('progress.currentCourses')
      .populate('progress.completedCourses')
      .select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ message: 'Identity not found in the database.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 3 * 60 * 1000; // 3 minutes
    await user.save();

    const mailOptions = {
      from: '"Green Skill Rural Security" <nallamilliramacharanreddy@gmail.com>',
      to: user.email,
      subject: 'Green Skill Rural - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your Green Skill Rural account. Here is your security OTP:</p>
          <h1 style="letter-spacing: 5px; color: #047857;">${otp}</h1>
          <p>This OTP will expire in 3 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    console.log(`[SECURITY] Forgot Password OTP generated for ${user.email}: ${otp}`);
    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('Error sending Forgot Password OTP email (gracefully handled):', err);
    }
    res.json({ message: 'OTP sent to your registered email address.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.resetPasswordOtp !== otp || user.resetPasswordOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.resetPasswordOtp !== otp || user.resetPasswordOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain uppercase, lowercase, number, and special character.' });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You may now login.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

const verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'admin') {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const cleanOtp = otp ? otp.trim() : '';

    if (!user.adminOtp || user.adminOtp !== cleanOtp || user.adminOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    user.adminOtp = undefined;
    user.adminOtpExpires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      token,
      user: userResponse,
      message: 'Admin Authentication Successful'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.notes.push({ title, content });
    await user.save();
    
    res.json({ message: 'Note added successfully', notes: user.notes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.notes = user.notes.filter(note => note._id.toString() !== noteId);
    await user.save();
    
    res.json({ message: 'Note deleted successfully', notes: user.notes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  signup, login, getAllUsers, getAllHirers, getAllAdmins, 
  approveAdmin, approveHirer, rejectHirer, updateUserStatus, deleteUser, getLeaderboard,
  requestReactivation, handleSuspensionRequest, updateProfile, forgotPasswordRequest, verifyForgotPasswordOtp, resetPasswordWithOtp, verifyAdminOtp,
  addNote, deleteNote
};

const editNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { title, content } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const note = user.notes.id(noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    note.title = title || note.title;
    note.content = content || note.content;
    
    await user.save();
    res.json({ message: 'Note updated successfully', notes: user.notes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports.editNote = editNote;
