const express = require("express");
const router = express.Router();
const ApiTicketController = require("../../controller/api/ticketController");

router.get("/", ApiTicketController.index);

module.exports = router;
