const express = require('express');
const router = express.Router();
const qrController = require('../../controller/api/qrController');

// Route tạo mã QR
router.post('/generate', qrController.generateQR);

// Route quét mã QR
router.post('/scan', qrController.scanQR);

// Route gửi lại mã QR qua email
router.post('/resend-email', qrController.resendQREmail);

module.exports = router; 