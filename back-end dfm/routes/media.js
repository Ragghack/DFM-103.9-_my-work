const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth, adminAuth } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// configure cloudinary from env if available
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
}

// POST /api/media/upload (admin only)
router.post('/upload', auth, adminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    if (!process.env.CLOUDINARY_URL) {
      return res.status(501).json({ message: 'Cloudinary not configured. Set CLOUDINARY_URL in env.' });
    }

    // upload buffer to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'dfm_media' }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      stream.end(req.file.buffer);
    });

    res.json({ url: result.secure_url, raw: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;
// end of media routes
