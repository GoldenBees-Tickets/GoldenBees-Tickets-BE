const express = require("express");
const router = express.Router();
const ApiHolidayDateController = require("../../controller/api/holidayDateController");
const AuthorizationAdmin = require("../../middleware/authorizationAdmin");

router.get("/", ApiHolidayDateController.index);
router.put("/:id", AuthorizationAdmin, ApiHolidayDateController.update);

module.exports = router;
