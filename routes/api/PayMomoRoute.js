const express = require("express");
const router = express.Router();
const paymentController = require("../../controller/api/paymentMomoController");

// Định tuyến API thanh toán MoMo
router.post("/pay-with-momo", paymentController.payWithMoMo);
router.post("/callback", paymentController.handleCallback);
router.get("/status/:orderId", paymentController.checkPaymentStatus);

module.exports = router;
