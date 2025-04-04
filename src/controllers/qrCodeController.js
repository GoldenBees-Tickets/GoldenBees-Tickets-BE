const QRCode = require('qrcode');
const Ticket1 = require('../models/Ticket');
const { validationResult } = require('express-validator');

// Tạo mã QR
exports.generateQRCode = async (req, res) => {
  try {
    const { ticketData } = req.body;
    
    // Tạo mã QR từ dữ liệu vé
    const qrCode = await QRCode.toDataURL(ticketData);
    
    res.json({
      success: true,
      data: {
        qrUrl: qrCode
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo mã QR'
    });
  }
};

// Quét mã QR và cập nhật trạng thái vé
exports.scanQRCode = async (req, res) => {
  try {
    const { ticketId } = req.body;
    
    // Tìm vé trong database
    const ticket = await Ticket1.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vé'
      });
    }
    
    // Kiểm tra trạng thái vé
    if (ticket.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'Vé đã được sử dụng'
      });
    }
    
    // Cập nhật trạng thái vé thành đã sử dụng
    ticket.status = 'used';
    ticket.usedAt = new Date();
    await ticket.save();
    
    res.json({
      success: true,
      message: 'Vé đã được xác nhận sử dụng',
      data: {
        ticket: {
          id: ticket._id,
          movieName: ticket.movieName,
          showTime: ticket.showTime,
          seat: ticket.seat,
          status: ticket.status,
          usedAt: ticket.usedAt
        }
      }
    });
  } catch (error) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi quét mã QR'
    });
  }
}; 