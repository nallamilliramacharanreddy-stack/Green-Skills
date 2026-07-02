const Video = require('../models/Video');
const { uploadVideoDirect, deleteFromCloudinary } = require('../utils/cloudinary');
const fs = require('fs');

// POST /api/admin/videos/upload
const uploadVideo = async (req, res) => {
  console.log('[VideoController] Incoming request originalUrl:', req.originalUrl);
  console.log('[VideoController] req.body:', req.body);
  console.log('[VideoController] req.file:', req.file);

  if (!req.file) {
    console.error('[VideoController] No video file provided');
    return res.status(400).json({ success: false, message: 'No video file provided' });
  }

  const { title, description } = req.body;
  if (!title || !title.trim()) {
    console.error('[VideoController] Title is required but missing or empty');
    // Delete temp file before returning
    if (fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  try {
    console.log(`[VideoController] Uploading video "${title}" to Cloudinary...`);
    const uploadRes = await uploadVideoDirect(req.file.path);
    console.log('[VideoController] Cloudinary upload success:', uploadRes);

    // Generate thumbnail URL by changing extension to .jpg (Cloudinary feature)
    const thumbnailUrl = uploadRes.secure_url.replace(/\.[^/.]+$/, '.jpg');

    const video = new Video({
      title: title.trim(),
      description: description ? description.trim() : '',
      cloudinaryPublicId: uploadRes.public_id,
      videoUrl: uploadRes.secure_url,
      thumbnailUrl,
      duration: Math.round(uploadRes.duration || 0),
      fileSize: uploadRes.bytes || req.file.size,
      uploadedBy: req.user.id
    });

    await video.save();
    console.log('[VideoController] Video successfully saved to MongoDB:', video._id);

    res.status(201).json({
      success: true,
      message: 'Video uploaded and saved successfully',
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration
      }
    });
  } catch (error) {
    console.warn('[VideoController] Cloudinary upload failed. Attempting local storage fallback:', error.message);
    try {
      const videosDir = path.resolve(__dirname, '../uploads/videos');
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = 'direct-' + uniqueSuffix + path.extname(req.file.originalname);
      const newPath = path.join(videosDir, filename);
      
      // Move the file from temp dir to permanent uploads/videos dir
      fs.copyFileSync(req.file.path, newPath);
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      
      // Override req.file.path to prevent the finally block from throwing an error trying to delete it
      const tempPath = req.file.path;
      req.file.path = null;
      
      const localUrl = `${req.protocol}://${req.get('host')}/api/videos/stream/${filename}`;
      console.log(`[VideoController] Local fallback streaming URL generated: ${localUrl}`);

      const video = new Video({
        title: title.trim(),
        description: description ? description.trim() : '',
        cloudinaryPublicId: `local-${filename}`,
        videoUrl: localUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=640', // default thumbnail
        duration: 0,
        fileSize: req.file.size,
        uploadedBy: req.user.id
      });

      await video.save();
      console.log('[VideoController] Local fallback video successfully saved to MongoDB:', video._id);

      return res.status(201).json({
        success: true,
        message: 'Video uploaded and saved to local server storage (Cloudinary fallback)',
        video: {
          id: video._id,
          title: video.title,
          description: video.description,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration
        }
      });
    } catch (fallbackError) {
      console.error('[VideoController] Fallback to local storage also failed:', fallbackError);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload video to Cloudinary and local fallback failed', 
        error: error.message 
      });
    }
  } finally {
    // Ensure local file is unlinked in all circumstances
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
};

// GET /api/videos
const getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const skip = (page - 1) * limit;

    const total = await Video.countDocuments();
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      videos: videos.map(v => ({
        id: v._id,
        title: v.title,
        description: v.description,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        duration: v.duration
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[VideoController] Fetch videos failed:', error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
};

// GET /api/videos/:id
const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json({
      id: video._id,
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration
    });
  } catch (error) {
    console.error('[VideoController] Fetch video by ID failed:', error);
    res.status(500).json({ message: 'Error fetching video details' });
  }
};

// PUT /api/admin/videos/:id
const updateVideo = async (req, res) => {
  const { title, description } = req.body;

  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(404).json({ message: 'Video not found' });
    }

    if (title) video.title = title.trim();
    if (description !== undefined) video.description = description.trim();

    // If replacing the file
    if (req.file) {
      console.log(`[VideoController] Replacing video file for ID ${video._id}...`);
      
      // Delete old Cloudinary asset
      try {
        await deleteFromCloudinary(video.cloudinaryPublicId, 'video');
      } catch (err) {
        console.warn(`[VideoController] Warning: failed to delete old asset ${video.cloudinaryPublicId}:`, err.message);
      }

      // Upload new file
      const uploadRes = await uploadVideoDirect(req.file.path);
      const thumbnailUrl = uploadRes.secure_url.replace(/\.[^/.]+$/, '.jpg');

      video.cloudinaryPublicId = uploadRes.public_id;
      video.videoUrl = uploadRes.secure_url;
      video.thumbnailUrl = thumbnailUrl;
      video.duration = Math.round(uploadRes.duration || 0);
      video.fileSize = uploadRes.bytes || req.file.size;
    }

    await video.save();

    res.json({
      message: 'Video updated successfully',
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration
      }
    });
  } catch (error) {
    console.error('[VideoController] Update video failed:', error);
    res.status(500).json({ message: 'Error updating video', error: error.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
};

// DELETE /api/admin/videos/:id
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Delete from Cloudinary
    console.log(`[VideoController] Deleting video ${video.cloudinaryPublicId} from Cloudinary...`);
    try {
      await deleteFromCloudinary(video.cloudinaryPublicId, 'video');
    } catch (err) {
      console.error('[VideoController] Failed to delete from Cloudinary:', err.message);
    }

    // Delete database record
    await Video.findByIdAndDelete(req.params.id);

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('[VideoController] Delete video failed:', error);
    res.status(500).json({ message: 'Error deleting video' });
  }
};

module.exports = {
  uploadVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo
};
