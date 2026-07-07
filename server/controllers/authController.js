const User = require('../models/User');
const Course = require('../models/Course');
const jwt = require('jsonwebtoken');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const nodemailer = require('nodemailer');
const dns = require('dns');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your_secret_encryption_key_32bytes_!';
const IV_LENGTH = 16;

const getEncryptionKey = () => {
  let key = ENCRYPTION_KEY;
  if (key.length < 32) {
    key = key.padEnd(32, 'a');
  } else if (key.length > 32) {
    key = key.substring(0, 32);
  }
  return Buffer.from(key);
};

const encryptEmbedding = (embeddingArray) => {
  try {
    if (!embeddingArray) return '';
    const text = JSON.stringify(embeddingArray);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    console.error('Encryption error:', err);
    return '';
  }
};

const decryptEmbedding = (encryptedText) => {
  try {
    if (!encryptedText) return null;
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedTextBuffer = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedTextBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (err) {
    console.error('Decryption error:', err);
    return null;
  }
};

const calculateEuclideanDistance = (arr1, arr2) => {
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return 999;
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    sum += Math.pow(arr1[i] - arr2[i], 2);
  }
  return Math.sqrt(sum);
};

const { sendEmail } = require('../utils/emailService');

const generatePremiumEmail = (otp) => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; font-weight: 900;">
        <span style="color: #34d399;">GREEN SKILL</span> <span style="color: #ffffff;">RURAL</span>
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

    // Face validation disabled on signup

    let encryptedFace = undefined;
    const rawEmbedding = req.body.facialEmbedding || profileData.facialEmbedding;
    if (rawEmbedding) {
      let parsedEmbed = rawEmbedding;
      if (typeof parsedEmbed === 'string') {
        try {
          parsedEmbed = JSON.parse(parsedEmbed);
        } catch (e) {
          parsedEmbed = parsedEmbed.split(',').map(Number);
        }
      }
      if (Array.isArray(parsedEmbed) && parsedEmbed.length > 0) {
        encryptedFace = encryptEmbedding(parsedEmbed);
      }
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Handle Multiple Files with Cloudinary
    let profilePicUrl = '';
    let profilePicPublicId = '';
    let companyDocUrl = '';
    let companyDocPublicId = '';
    
    try {
      if (req.files) {
        if (req.files['profilePicture']) {
          const file = req.files['profilePicture'][0];
          const uploadRes = await uploadToCloudinary(file.path, 'profiles', 'image');
          profilePicUrl = uploadRes.secure_url;
          profilePicPublicId = uploadRes.public_id;
        }
        if (req.files['companyDocument']) {
          const file = req.files['companyDocument'][0];
          const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw';
          const uploadRes = await uploadToCloudinary(file.path, 'documents', resourceType);
          companyDocUrl = uploadRes.secure_url;
          companyDocPublicId = uploadRes.public_id;
        }
      } else if (req.file) {
        // Fallback for older singular uploads
        const uploadRes = await uploadToCloudinary(req.file.path, 'profiles', 'image');
        profilePicUrl = uploadRes.secure_url;
        profilePicPublicId = uploadRes.public_id;
      }
    } catch (uploadError) {
      console.error('Cloudinary upload during signup failed:', uploadError);
      return res.status(500).json({ message: 'Media upload failed', error: uploadError.message });
    }

    // Prepare company details
    const companyDetails = {
      companyName: profileData.companyName,
      registrationNumber: profileData.registrationNumber,
      companyDocument: companyDocUrl,
      companyDocumentPublicId: companyDocPublicId,
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
      facialEmbedding: encryptedFace,
      companyDetails: role === 'employer' ? companyDetails : undefined,
      profilePicture: profilePicUrl,
      profilePicturePublicId: profilePicPublicId
    });

    try {
      await user.save();
    } catch (saveError) {
      // Clean up uploaded Cloudinary assets to avoid orphan assets
      if (profilePicPublicId) {
        await deleteFromCloudinary(profilePicPublicId, 'image').catch(console.error);
      }
      if (companyDocPublicId) {
        const isImage = req.files && req.files['companyDocument'] && req.files['companyDocument'][0].mimetype.startsWith('image/');
        await deleteFromCloudinary(companyDocPublicId, isImage ? 'image' : 'raw').catch(console.error);
      }
      throw saveError;
    }

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
      .populate({
        path: 'progress.currentCourses',
        select: '-quiz -enrolledStudents -lessons.quiz -lessons.subtitles -lessons.audioTracks'
      })
      .populate({
        path: 'progress.completedCourses',
        select: '-quiz -enrolledStudents -lessons.quiz -lessons.subtitles -lessons.audioTracks'
      });
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

      // Reuse existing valid OTP if generated recently (within last 3 minutes) to prevent invalidation on multiple clicks
      let otp = user.adminOtp;
      const now = Date.now();
      const threeMinutesInMs = 3 * 60 * 1000;
      const isOtpRecent = user.adminOtpExpires && (new Date(user.adminOtpExpires).getTime() - now > (15 * 60 * 1000 - threeMinutesInMs));
      
      if (!otp || !isOtpRecent) {
        otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.adminOtp = otp;
        user.adminOtpExpires = new Date(now + 15 * 60 * 1000); // 15 minutes
        await user.save();
      }

      const mailOptions = {
        from: '"Green Skill Rural Security" <nallamilliramacharanreddy@gmail.com>',
        to: user.email,
        subject: 'Green Skill Rural Admin - Security OTP',
        html: generatePremiumEmail(otp)
      };

      console.log(`[SECURITY] Admin Login OTP generated for ${user.email}: ${otp}`);
      // Send email asynchronously so that login is fast and doesn't block the client response
      sendEmail({
        to: user.email,
        subject: 'Green Skill Rural Admin - Security OTP',
        html: mailOptions.html
      }).catch((err) => {
        console.error('Error sending OTP email (handled asynchronously):', err);
      });

      return res.json({ requiresOtp: true, email: user.email, message: 'Security OTP sent to your email.' });
    }

    if (user.role === 'employer') {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.facialEmbedding;

      return res.json({
        token,
        user: userResponse,
        message: 'Authentication Successful'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Face validation disabled on login

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.facialEmbedding;

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
    const userToDelete = await User.findById(id);
    if (userToDelete) {
      if (userToDelete.profilePicturePublicId) {
        await deleteFromCloudinary(userToDelete.profilePicturePublicId, 'image').catch(console.error);
      }
      if (userToDelete.companyDetails && userToDelete.companyDetails.companyDocumentPublicId) {
        const docUrl = userToDelete.companyDetails.companyDocument;
        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(docUrl || '');
        await deleteFromCloudinary(userToDelete.companyDetails.companyDocumentPublicId, isImage ? 'image' : 'raw').catch(console.error);
      }
    }
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

    if (userToDelete) {
      if (userToDelete.profilePicturePublicId) {
        await deleteFromCloudinary(userToDelete.profilePicturePublicId, 'image').catch(console.error);
      }
      if (userToDelete.companyDetails && userToDelete.companyDetails.companyDocumentPublicId) {
        const docUrl = userToDelete.companyDetails.companyDocument;
        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(docUrl || '');
        await deleteFromCloudinary(userToDelete.companyDetails.companyDocumentPublicId, isImage ? 'image' : 'raw').catch(console.error);
      }
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
      const oldUser = await User.findById(id);
      if (oldUser && oldUser.profilePicturePublicId) {
        await deleteFromCloudinary(oldUser.profilePicturePublicId, 'image').catch(console.error);
      }
      try {
        const uploadRes = await uploadToCloudinary(req.file.path, 'profiles', 'image');
        updateData.profilePicture = uploadRes.secure_url;
        updateData.profilePicturePublicId = uploadRes.public_id;
      } catch (uploadError) {
        console.error('Cloudinary profile picture upload failed:', uploadError);
        return res.status(500).json({ message: 'Failed to upload profile picture', error: uploadError.message });
      }
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

    // Reuse existing valid reset OTP if generated recently (within last 3 minutes) to prevent race conditions on rapid clicks
    let otp = user.resetPasswordOtp;
    const now = Date.now();
    const threeMinutesInMs = 3 * 60 * 1000;
    const isOtpRecent = user.resetPasswordOtpExpires && (new Date(user.resetPasswordOtpExpires).getTime() - now > (15 * 60 * 1000 - threeMinutesInMs));
    
    if (!otp || !isOtpRecent) {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetPasswordOtp = otp;
      user.resetPasswordOtpExpires = new Date(now + 15 * 60 * 1000); // 15 minutes
      await user.save();
    }

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
    // Send email asynchronously so that forgot password request doesn't block the client response
    sendEmail({
      to: user.email,
      subject: 'Green Skill Rural - Password Reset OTP',
      html: mailOptions.html
    }).catch((err) => {
      console.error('Error sending Forgot Password OTP email (handled asynchronously):', err);
    });
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

    const cleanOtp = otp ? otp.trim() : '';

    if (!user || user.resetPasswordOtp !== cleanOtp || user.resetPasswordOtpExpires < Date.now()) {
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

    const cleanOtp = otp ? otp.trim() : '';

    if (!user || user.resetPasswordOtp !== cleanOtp || user.resetPasswordOtpExpires < Date.now()) {
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
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || (user.role !== 'admin' && user.role !== 'employer')) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const cleanOtp = otp ? otp.trim() : '';
    const activeOtp = user.role === 'admin' ? user.adminOtp : user.employerOtp;
    const activeOtpExpires = user.role === 'admin' ? user.adminOtpExpires : user.employerOtpExpires;

    if (!activeOtp || activeOtp !== cleanOtp || activeOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    if (user.role === 'admin') {
      user.adminOtp = undefined;
      user.adminOtpExpires = undefined;
    } else {
      user.employerOtp = undefined;
      user.employerOtpExpires = undefined;
    }
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      token,
      user: userResponse,
      message: 'Authentication Successful'
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

const verifyFaceLogin = async (req, res) => {
  try {
    const { userId, facialEmbedding } = req.body;
    if (!userId || !facialEmbedding) {
      return res.status(400).json({ message: 'Missing userId or facialEmbedding' });
    }

    const user = await User.findById(userId)
      .populate('progress.currentCourses')
      .populate('progress.completedCourses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.facialEmbedding) {
      return res.status(400).json({ message: 'No face profile registered for this user' });
    }

    let submittedEmbed = facialEmbedding;
    if (typeof submittedEmbed === 'string') {
      try {
        submittedEmbed = JSON.parse(submittedEmbed);
      } catch (e) {
        submittedEmbed = submittedEmbed.split(',').map(Number);
      }
    }

    if (!Array.isArray(submittedEmbed) || submittedEmbed.length === 0) {
      return res.status(400).json({ message: 'Invalid facial embedding format' });
    }

    const registeredEmbed = decryptEmbedding(user.facialEmbedding);
    if (!registeredEmbed) {
      return res.status(500).json({ message: 'Failed to decrypt face profile' });
    }

    const distance = calculateEuclideanDistance(submittedEmbed, registeredEmbed);
    console.log(`[Face Verification] Distance for user ${user.name}: ${distance}`);

    if (distance <= 0.6) {
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.facialEmbedding;

      res.json({
        success: true,
        token,
        user: userResponse
      });
    } else {
      res.status(400).json({ message: 'Face verification failed. Please use the registered face.' });
    }
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ message: 'Server error during face verification' });
  }
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

const getFaceDescriptor = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.facialEmbedding) {
      return res.status(404).json({ message: 'No face profile registered for this user' });
    }
    const registeredEmbed = decryptEmbedding(user.facialEmbedding);
    if (!registeredEmbed) {
      return res.status(500).json({ message: 'Failed to decrypt face profile' });
    }
    res.json({ success: true, facialEmbedding: registeredEmbed });
  } catch (error) {
    console.error('Error fetching face descriptor:', error);
    res.status(500).json({ message: 'Server error fetching face descriptor' });
  }
};

const NameChangeRequest = require('../models/NameChangeRequest');

const submitNameChangeRequest = async (req, res) => {
  try {
    const { userId, oldName, newName } = req.body;
    if (!userId || !oldName || !newName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if there is already a pending request
    const existing = await NameChangeRequest.findOne({ user: userId, status: 'pending' });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending name change request.' });
    }

    const request = new NameChangeRequest({
      user: userId,
      oldName,
      newName
    });

    await request.save();
    res.status(201).json({ message: 'Name change request submitted successfully', request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getNameChangeRequests = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { user: userId } : {};
    const requests = await NameChangeRequest.find(filter).populate('user', 'name email role').sort({ requestedAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const decideNameChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, decidedBy } = req.body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be approve or reject.' });
    }

    const request = await NameChangeRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed.' });
    }

    if (action === 'approve') {
      request.status = 'approved';
      // Update User name
      await User.findByIdAndUpdate(request.user, { name: request.newName });
    } else {
      request.status = 'rejected';
    }

    request.decidedAt = new Date();
    request.decidedBy = decidedBy;
    await request.save();

    res.json({ message: `Request successfully ${action}d`, request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  signup, login, getAllUsers, getAllHirers, getAllAdmins, 
  approveAdmin, approveHirer, rejectHirer, updateUserStatus, deleteUser, getLeaderboard,
  requestReactivation, handleSuspensionRequest, updateProfile, forgotPasswordRequest, verifyForgotPasswordOtp, resetPasswordWithOtp, verifyAdminOtp,
  addNote, deleteNote, editNote, verifyFaceLogin, getFaceDescriptor,
  submitNameChangeRequest, getNameChangeRequests, decideNameChangeRequest
};
