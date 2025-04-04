const { ChatHistory } = require('../models');

class ChatHistoryService {
  // Lấy tất cả lịch sử chat của một user
  async getChatHistoryByUserId(userId) {
    try {
      const messages = await ChatHistory.findAll({
        where: { userId },
        order: [['timestamp', 'ASC']]
      });
      return messages;
    } catch (error) {
      throw new Error(`Error getting chat history: ${error.message}`);
    }
  }

  // Lấy tất cả lịch sử chat của tất cả users
  async getAllChatHistories() {
    try {
      return await ChatHistory.findAll({
        order: [['timestamp', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Error getting all chat histories: ${error.message}`);
    }
  }

  // Thêm tin nhắn mới vào lịch sử chat
  async addMessage(userId, message) {
    try {
      const newMessage = await ChatHistory.create({
        userId,
        text: message.text,
        sender: message.sender,
        timestamp: new Date()
      });
      return newMessage;
    } catch (error) {
      throw new Error(`Error adding message: ${error.message}`);
    }
  }

  // Xóa toàn bộ lịch sử chat của một user
  async deleteChatHistory(userId) {
    try {
      const result = await ChatHistory.destroy({
        where: { userId }
      });
      return result;
    } catch (error) {
      throw new Error(`Error deleting chat history: ${error.message}`);
    }
  }

  // Xóa một tin nhắn cụ thể trong lịch sử chat
  async deleteMessage(userId, messageId) {
    try {
      const result = await ChatHistory.destroy({
        where: {
          id: messageId,
          userId: userId
        }
      });
      return result;
    } catch (error) {
      throw new Error(`Error deleting message: ${error.message}`);
    }
  }

  // Cập nhật nội dung một tin nhắn
  async updateMessage(userId, messageId, newText) {
    try {
      const [updated] = await ChatHistory.update(
        { text: newText },
        {
          where: {
            id: messageId,
            userId: userId
          }
        }
      );
      if (!updated) {
        throw new Error('Message not found');
      }
      return await ChatHistory.findByPk(messageId);
    } catch (error) {
      throw new Error(`Error updating message: ${error.message}`);
    }
  }
}

module.exports = new ChatHistoryService(); 