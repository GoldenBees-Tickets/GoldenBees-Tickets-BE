const express = require("express");
const router = express.Router();
const chatbotController = require("../../controllers/chatbotController");

// API endpoint cho chatbot
router.post("/chat", chatbotController.generateResponse);

// API endpoint để lấy giá vé cho một suất chiếu
router.get("/ticket-price/:showtime_id", chatbotController.getTicketPrice);

// API endpoint để lấy thông tin về tất cả các loại ghế
router.get("/seat-types", chatbotController.getAllSeatTypes);

module.exports = router;
