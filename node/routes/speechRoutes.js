const express = require('express');
const router = express.Router();
const { transcribeSpeech } = require('../controllers/speechController');

router.post('/', transcribeSpeech);

module.exports = router;