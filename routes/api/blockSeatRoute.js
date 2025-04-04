const express = require("express");
const router = express.Router();
const ApiBlockSeatController = require("../../controller/api/blockSeatController");

router.get("/", ApiBlockSeatController.index);

module.exports = router;
