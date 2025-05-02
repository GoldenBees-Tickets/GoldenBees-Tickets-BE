const express = require("express");
const router = express.Router();
const ApiPriceSettingController = require("../../controller/api/priceSettingController");

router.get("/", ApiPriceSettingController.index);
router.post("/", ApiPriceSettingController.create);
router.put("/:id", ApiPriceSettingController.update);
router.post("/holiday", ApiPriceSettingController.createHolidayDateController);
router.put("/holiday/:id", ApiPriceSettingController.updateHolidayDateController);
router.get("/holiday", ApiPriceSettingController.getAllHolidayDateController);

module.exports = router;
