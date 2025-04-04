const express = require('express');
const router = express.Router();
const voiceConverterController = require('../controllers/voiceConverter/voiceConverterController');

/**
 * @route POST /api/voice-converter/text-to-speech
 * @desc Chuyển văn bản thành giọng nói
 * @access Public
 */
router.post('/text-to-speech', voiceConverterController.textToSpeech);

/**
 * @route GET /api/voice-converter/voices
 * @desc Lấy danh sách giọng nói có sẵn
 * @access Public
 */
router.get('/voices', voiceConverterController.getAvailableVoices);

module.exports = router; 