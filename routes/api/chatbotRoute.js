const express = require("express");
const router = express.Router();
const chatbotController = require("../../controllers/chatbotController");

// API endpoint cho chatbot
router.post("/chat", chatbotController.generateResponse);

module.exports = router;
