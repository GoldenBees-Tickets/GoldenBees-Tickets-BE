const express = require("express");
const router = express.Router();
const ApiTicketStatusController = require("../../controller/api/ticketStatusController");

router.get("/", ApiTicketStatusController.index);

module.exports = router;
