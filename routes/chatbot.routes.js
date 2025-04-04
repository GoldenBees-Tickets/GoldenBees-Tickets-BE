const express = require('express');
const router = express.Router();
const chatHistoryController = require('../controllers/chatHistoryController');
const chatHistoryService = require('../services/chatHistoryService');

// Route để gửi tin nhắn và nhận phản hồi từ chatbot
router.post('/send', async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.body.userId || 1; // Tạm thời hardcode userId = 1

        // Lưu tin nhắn của user
        await chatHistoryService.addMessage(userId, message);

        // TODO: Xử lý tin nhắn với chatbot và lưu phản hồi
        // Tạm thời trả về phản hồi mẫu
        const aiResponse = {
            text: "Xin chào! Tôi là chatbot của hệ thống. Tôi có thể giúp gì cho bạn?",
            sender: 'ai'
        };

        // Lưu phản hồi của chatbot
        await chatHistoryService.addMessage(userId, aiResponse);

        // Trả về kết quả
        res.json({ success: true, data: aiResponse });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 