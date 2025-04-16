const express = require('express');
const vnpayTestController = require('../../controller/api/vnpayTestController');

const router = express.Router();

/**
 * @route   POST /v1/api/test-vnpay/create-payment
 * @desc    Tạo URL thanh toán VNPay test
 * @access  Public
 */
router.post('/create-payment', vnpayTestController.createTestPayment);

/**
 * @route   GET /v1/api/test-vnpay/payment-return
 * @desc    Xử lý kết quả thanh toán VNPay
 * @access  Public
 */
router.get('/payment-return', vnpayTestController.processPaymentReturn);

/**
 * @route   GET /v1/api/test-vnpay/verify-payment
 * @desc    Xác thực kết quả thanh toán VNPay (cho client)
 * @access  Public
 */
router.get('/verify-payment', vnpayTestController.verifyPayment);

/**
 * @route   GET /v1/api/test-vnpay/ipn
 * @desc    Xử lý IPN từ VNPay
 * @access  Public
 */
router.get('/ipn', vnpayTestController.processIpn);

/**
 * @route   GET /v1/api/test-vnpay/callback
 * @desc    Xử lý callback từ VNPay và redirect người dùng
 * @access  Public
 */
router.get('/callback', vnpayTestController.handleCallback);

/**
 * @route   GET /v1/api/test-vnpay/payment-status/:orderId
 * @desc    Kiểm tra trạng thái thanh toán
 * @access  Public
 */
router.get('/payment-status/:orderId', vnpayTestController.checkPaymentStatus);

module.exports = router; 