const express = require('express');
const router = express.Router();
const { payWithMomo, momoIpnCallback } = require('../controllers/paymentMomoController');

// Route thanh toán với MOMO
router.post('/pay-with-momo', payWithMomo);

// Route callback từ MOMO (IPN - Instant Payment Notification)
router.post('/ipn', momoIpnCallback);

module.exports = router; 