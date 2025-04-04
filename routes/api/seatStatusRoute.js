const express = require("express");
const router = express.Router();
const ApiSeatStatusController = require("../../controller/api/seatStatusController");

router.get("/", ApiSeatStatusController.index);

module.exports = router;
