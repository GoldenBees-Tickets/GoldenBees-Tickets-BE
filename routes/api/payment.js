const express = require('express');
const router = express.Router();
const paymentController = require("../../controller/api/paymentMomoController");

// Route thanh toán với MOMO
// router.post('/momo', paymentMomoController.payWithMoMo);

// // Route callback từ MOMO
// router.post('/momo/callback', paymentMomoController.handleCallback);

router.post("/pay-with-momo", paymentController.payWithMoMo);
router.post("/callback", paymentController.handleCallback);
router.get("/status/:orderId", paymentController.checkPaymentStatus);

module.exports = router; 