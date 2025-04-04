const express = require("express");
const router = express.Router();
const ApiPaymentSettingController = require("../../controller/api/paymentSettingController");

router.get("/", ApiPaymentSettingController.index);

module.exports = router;
