const express = require("express");
const router = express.Router();

const chatbotTestController = require("../../controller/api/chatboxtest");

router.get("/rap", chatbotTestController.index);
router.get("/cinema", chatbotTestController.index2);
router.get("/room", chatbotTestController.index3);
router.get("/ge/:id", chatbotTestController.index4);

module.exports = router;
