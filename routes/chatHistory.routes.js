const express = require('express');
const router = express.Router();
const chatHistoryController = require('../controllers/chatHistoryController');

// Lấy lịch sử chat của một user
router.get('/:userId', chatHistoryController.getChatHistory);

// Lấy tất cả lịch sử chat
router.get('/', chatHistoryController.getAllChatHistories);

// Thêm tin nhắn mới
router.post('/message', chatHistoryController.addMessage);

// Xóa toàn bộ lịch sử chat của một user
router.delete('/:userId', chatHistoryController.deleteChatHistory);

// Xóa một tin nhắn cụ thể
router.delete('/:userId/message/:messageId', chatHistoryController.deleteMessage);

// Cập nhật nội dung tin nhắn
router.put('/:userId/message/:messageId', chatHistoryController.updateMessage);

module.exports = router; 