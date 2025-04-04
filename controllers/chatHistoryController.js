const chatHistoryService = require('../services/chatHistoryService');

class ChatHistoryController {
  // Lấy lịch sử chat của một user
  async getChatHistory(req, res) {
    try {
      const userId = req.params.userId;
      const messages = await chatHistoryService.getChatHistoryByUserId(userId);
      res.json({ success: true, data: messages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Lấy tất cả lịch sử chat
  async getAllChatHistories(req, res) {
    try {
      const histories = await chatHistoryService.getAllChatHistories();
      res.json({ success: true, data: histories });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Thêm tin nhắn mới
  async addMessage(req, res) {
    try {
      const { userId, message } = req.body;
      const result = await chatHistoryService.addMessage(userId, message);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Xóa toàn bộ lịch sử chat của một user
  async deleteChatHistory(req, res) {
    try {
      const userId = req.params.userId;
      const result = await chatHistoryService.deleteChatHistory(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Xóa một tin nhắn cụ thể
  async deleteMessage(req, res) {
    try {
      const { userId, messageId } = req.params;
      const result = await chatHistoryService.deleteMessage(userId, messageId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Cập nhật nội dung tin nhắn
  async updateMessage(req, res) {
    try {
      const { userId, messageId } = req.params;
      const { newText } = req.body;
      const result = await chatHistoryService.updateMessage(userId, messageId, newText);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ChatHistoryController(); 