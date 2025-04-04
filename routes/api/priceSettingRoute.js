const express = require("express");
const router = express.Router();
const ApiPriceSettingController = require("../../controller/api/priceSettingController");

router.get("/:id", ApiPriceSettingController.index);
router.post("/", ApiPriceSettingController.create);

module.exports = router;
