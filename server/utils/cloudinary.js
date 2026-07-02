const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary SDK with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a local file to Cloudinary and deletes the local file afterwards.
 * Supports image, video, and raw resource types.
 * 
 * @param {string} filePath - Local filesystem path of the file to upload.
 * @param {string} folder - Destination folder on Cloudinary.
 * @param {string} resourceType - 'image', 'video', 'raw', or 'auto'.
 * @returns {Promise<object>} Object containing secure_url, public_id, resource_type, format, width, height, and duration.
 */
const uploadToCloudinary = async (filePath, folder = 'green_skills', resourceType = 'auto') => {
  try {
    const options = {
      folder: folder,
      resource_type: resourceType,
    };

    // Apply auto-compression & formats for images and videos to optimize bandwidth
    if (resourceType === 'image') {
      options.transformation = [
        { quality: 'auto', fetch_format: 'auto' }
      ];
    } else if (resourceType === 'video') {
      options.transformation = [
        { quality: 'auto', fetch_format: 'auto' }
      ];
    }

    const result = await cloudinary.uploader.upload(filePath, options);

    // Clean up local temp file synchronously
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`[Cloudinary] Failed to delete local temp file ${filePath}:`, err.message);
      }
    }

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration || null
    };
  } catch (error) {
    // Crucial: Clean up local file even in case of failure to keep local storage clean
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`[Cloudinary] Failed to delete local temp file on error fallback ${filePath}:`, err.message);
      }
    }
    throw error;
  }
};

/**
 * Deletes an asset from Cloudinary using its public ID.
 * 
 * @param {string} publicId - The public ID of the asset on Cloudinary.
 * @param {string} resourceType - 'image', 'video', 'raw', or 'auto'.
 * @returns {Promise<object>} Cloudinary deletion result object.
 */
const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error(`[Cloudinary] Failed to destroy asset ${publicId}:`, error.message);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};
