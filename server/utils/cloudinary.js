const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary SDK with environment variables after trimming them
cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim()
});

/**
 * Uploads a local file using Cloudinary's unsigned upload preset.
 * Used as a fallback when signed API credentials are empty, invalid, or example placeholders.
 */
const uploadUnsigned = async (filePath, folder, resourceType) => {
  console.log(`[Cloudinary] Uploading ${path.basename(filePath)} using Cloudinary SDK unsigned upload...`);
  
  const options = {
    upload_preset: 'green_skills_preset',
    resource_type: resourceType || 'auto'
  };

  if (folder) {
    options.folder = folder;
  }

  // Use upload_large for videos or large files even when unsigned
  const isVideo = resourceType === 'video' || path.extname(filePath).toLowerCase().match(/\.(mp4|mov|avi|webm)$/);
  
  try {
    const result = await new Promise((resolve, reject) => {
      if (isVideo) {
        options.chunk_size = 6000000; // 6MB chunks
        cloudinary.uploader.upload_large(filePath, options, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      } else {
        cloudinary.uploader.unsigned_upload(filePath, 'green_skills_preset', options, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      }
    });
    return result;
  } catch (error) {
    console.error('[Cloudinary] SDK Unsigned upload failed:', error);
    throw error;
  }
};

/**
 * Uploads a local file to Cloudinary and deletes the local file afterwards.
 * Supports image, video, and raw resource types.
 * Bypasses signed credentials and falls back to unsigned upload preset if credentials are placeholders or invalid.
 * 
 * @param {string} filePath - Local filesystem path of the file to upload.
 * @param {string} folder - Destination folder on Cloudinary.
 * @param {string} resourceType - 'image', 'video', 'raw', or 'auto'.
 * @returns {Promise<object>} Object containing secure_url, public_id, resource_type, format, width, height, and duration.
 */
const uploadToCloudinary = async (filePath, folder = 'green_skills', resourceType = 'auto') => {
  // Check if credentials are the example placeholders from the tutorial
  const isExampleCredentials = !process.env.CLOUDINARY_API_KEY || 
                               !process.env.CLOUDINARY_API_SECRET;

  if (isExampleCredentials) {
    console.log('[Cloudinary] Example or missing credentials detected. Using unsigned upload fallback.');
    try {
      const result = await uploadUnsigned(filePath, folder, resourceType);
      
      // Clean up local temp file
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
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
    } catch (fallbackError) {
      console.error('[Cloudinary] Unsigned upload fallback failed:', fallbackError.message);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      throw fallbackError;
    }
  }

  try {
    const options = {
      folder: folder,
      resource_type: resourceType,
    };

    // Apply auto-compression & formats for images to optimize bandwidth
    if (resourceType === 'image') {
      options.transformation = [
        { quality: 'auto', fetch_format: 'auto' }
      ];
    }

    let result;
    if (resourceType === 'video') {
      options.chunk_size = 6000000; // 6MB chunks
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(filePath, options, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
    } else {
      result = await cloudinary.uploader.upload(filePath, options);
    }

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
    // If signed upload fails with authentication errors, fallback to unsigned preset
    const isAuthError = error.http_code === 401 || error.http_code === 403 || error.message?.includes('api_key');
    if (isAuthError) {
      console.warn('[Cloudinary] Signed upload failed with authentication error. Trying unsigned fallback...');
      try {
        const result = await uploadUnsigned(filePath, folder, resourceType);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
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
      } catch (fallbackError) {
        console.error('[Cloudinary] Unsigned fallback also failed:', fallbackError.message);
      }
    }

    // Keep local file on failure to allow local streaming fallback
    console.log(`[Cloudinary] Preserving local file at ${filePath} for local fallback streaming`);
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

/**
 * Uploads a video file directly to Cloudinary using the required options.
 */
const uploadVideoDirect = async (filePath) => {
  const options = {
    resource_type: 'video',
    folder: 'videos',
    overwrite: false,
    unique_filename: true,
    invalidate: true,
    chunk_size: 6000000 // 6MB chunks
  };

  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(filePath, options, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
    return result;
  } catch (error) {
    console.error('[Cloudinary] Video upload failed:', error.message);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadVideoDirect
};
