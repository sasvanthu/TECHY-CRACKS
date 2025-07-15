const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'product_images',
    });
    fs.unlinkSync(req.file.path); // Clean up temporary file
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
};

module.exports = { uploadImage };