const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../controllers/imageController');

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('image'), uploadImage);

module.exports = router;