const express = require('express');
const router = express.Router();
const { generateQRCode, scanQRCode } = require('../controllers/qrCodeController');
const { authenticateToken } = require('../middleware/auth');

// Route tạo mã QR
router.post('/generate', authenticateToken, generateQRCode);

// Route quét mã QR và cập nhật trạng thái vé
router.post('/scan', authenticateToken, scanQRCode);

module.exports = router; 