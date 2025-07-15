const express = require('express');
const router = express.Router();
const { generateDescription } = require('../controllers/descriptionController');

router.post('/', generateDescription);

module.exports = router;