import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import cloudinary from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

const router = express.Router();

router.post('/', protect, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }

  const localFilePath = req.file.path;
  const localFileName = req.file.filename;

  // Try Cloudinary upload if configuration exists
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      let folderName = 'general';
      if (req.baseUrl && req.baseUrl.includes('user')) folderName = 'users';
      else if (req.baseUrl && req.baseUrl.includes('destination')) folderName = 'destinations';
      else if (req.baseUrl && req.baseUrl.includes('rental')) folderName = 'rentals';
      else if (req.baseUrl && req.baseUrl.includes('stay')) folderName = 'stays';
      else if (req.baseUrl && req.baseUrl.includes('guide')) folderName = 'guides';

      const result = await cloudinary.uploader.upload(localFilePath, {
        folder: `discovery-uttarakhand/${folderName}`,
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      });

      // Cleanup local file after successful Cloudinary upload
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkErr) {
        // ignore unlink error
      }

      return res.status(200).json({
        success: true,
        image: {
          url: result.secure_url,
          publicId: result.public_id
        }
      });
    } catch (cloudErr) {
      console.warn('Cloudinary upload error, using local storage fallback:', cloudErr.message || cloudErr);
      // Fallback to local storage below
    }
  }

  // Local storage fallback
  const host = req.get('host');
  const protocol = req.protocol;
  const localUrl = `${protocol}://${host}/uploads/${localFileName}`;

  return res.status(200).json({
    success: true,
    image: {
      url: localUrl,
      publicId: localFileName
    }
  });
});

router.delete('/*publicId', protect, async (req, res) => {
  try {
    const { publicId } = req.params;
    if (!publicId) return res.status(400).json({ success: false, message: 'No publicId provided' });

    // Check if file exists in local uploads
    const localFile = path.join(uploadsDir, publicId);
    if (fs.existsSync(localFile)) {
      try {
        fs.unlinkSync(localFile);
        return res.json({ success: true, message: 'Local image deleted' });
      } catch (err) {
        console.error('Error removing local file:', err);
      }
    }

    // Try Cloudinary destroy
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (cErr) {
      console.warn('Cloudinary destroy notice:', cErr.message);
    }

    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
});

export default router;
