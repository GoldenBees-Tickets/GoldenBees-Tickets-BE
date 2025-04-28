const db = require('./models');
const { BlockSeat } = db;
const { Op } = require('sequelize');
const SEAT_TIMEOUT = 5 * 60 * 1000; // 5 phút


// Hàm xóa các ghế đã hết hạn
const clearExpiredSeats = async (io) => {
  try {
    const now = new Date();
    const expiredBlocks = await BlockSeat.findAll({
      where: {
        expires_at: {
          [Op.lt]: now
        }
      }
    });

    for (const block of expiredBlocks) {      
      // Thông báo cho các client đang ở trang thanh toán
      io.to(`showtime_${block.showtime_id}`).emit('seatUnavailable', {
        seat_ids: [block.seat_id],
        showtime_id: block.showtime_id,
      });
      
      await block.destroy();
      
      io.to(`showtime_${block.showtime_id}`).emit('seatUnbooked', {
        seat_id: block.seat_id,
        showtime_id: block.showtime_id,
        user_id: block.user_id
      });
    }
  } catch (error) {
    console.error('Error clearing expired seats:', error);
  }
};

// Định nghĩa hàm startCleanupInterval
const startCleanupInterval = (io) => {
  // Chạy lần đầu khi khởi động
  clearExpiredSeats(io);
  
  // Sau đó chạy mỗi phút
  const interval = setInterval(() => {
    clearExpiredSeats(io);
  }, 60000);

  return interval;
};

const handleSeatSocket = (io, socket) => {
  const { userType, showtime_id, user_id } = socket.handshake.query;
  if (showtime_id) {
    socket.join(`showtime_${showtime_id}`);
  }

  socket.on('bookSeat', async (data, callback) => {
    const { seat_id, showtime_id, user_id } = data;
    
    try {
      // Khi chọn ghế ở giao diện chọn ghế, chỉ lưu client-side, không gửi lên server
      // Trả về success: true ngay
      callback({ success: true });
    } catch (error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      callback({ 
        success: false, 
        message: 'Có lỗi xảy ra khi đặt ghế' 
      });
    }
  });

  socket.on('reserveSeats', async (data, callback) => {
    const { seat_ids, showtime_id, user_id } = data;
    
    try {
      // Kiểm tra tất cả ghế đã chọn có khả dụng không
      const existingBlocks = await BlockSeat.findAll({
        where: {
          seat_id: { [Op.in]: seat_ids },
          showtime_id,
          user_id: { [Op.ne]: parseInt(user_id) }, // Loại trừ ghế do chính user này chọn
          expires_at: {
            [Op.gt]: new Date()
          }
        }
      });

      if (existingBlocks.length > 0) {
        const blockedSeatIds = existingBlocks.map(b => b.seat_id);
        
        // Thông báo cho tất cả clients về ghế đã không khả dụng
        socket.emit('seatUnavailable', {
          seat_ids: blockedSeatIds,
          showtime_id
        });
        
        callback({
          success: false,
          message: 'Một số ghế đã được đặt trước bởi người khác, vui lòng chọn ghế khác!'
        });
        return;
      }

      // Xóa các block cũ của user này và tạo block mới với thời gian dài hơn
      await BlockSeat.destroy({
        where: {
          seat_id: { [Op.in]: seat_ids },
          user_id: parseInt(user_id),
          showtime_id: parseInt(showtime_id)
        }
      });

      // Tạo block mới với thời gian 5 phút
      const expires_at = new Date(Date.now() + SEAT_TIMEOUT);
      const blocks = await Promise.all(seat_ids.map(seat_id => 
        BlockSeat.create({
          seat_id: parseInt(seat_id),
          showtime_id: parseInt(showtime_id),
          user_id: parseInt(user_id),
          blocked_at: new Date(),
          expires_at
        })
      ));
      // Thông báo cho tất cả clients trong cùng showtime về ghế đã được đặt
      io.to(`showtime_${showtime_id}`).emit('seatBooked', {
        seat_ids,
        showtime_id,
        user_id
      });

      // Tính thời gian còn lại để hiển thị đếm ngược
      callback({ 
        success: true, 
        holdTime: Math.floor(SEAT_TIMEOUT / 1000),
        expires_at: expires_at.toISOString()
      });

    } catch (error) {
      console.error('Error reserving seats:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      callback({ 
        success: false, 
        message: 'Có lỗi xảy ra khi đặt ghế' 
      });
    }
  });

  // Xử lý khi phiên đặt vé hết hạn
  socket.on('sessionExpired', async (data) => {
    const { user_id, showtime_id, seat_ids } = data;

    try {
      // Xóa tất cả ghế đã block của user này
      await BlockSeat.destroy({
        where: {
          user_id: parseInt(user_id),
          showtime_id: parseInt(showtime_id),
          seat_id: { [Op.in]: seat_ids }
        }
      });

      // Thông báo cho tất cả clients trong cùng showtime
      io.to(`showtime_${showtime_id}`).emit('seatUnbooked', {
        seat_ids,
        showtime_id,
        user_id
      });

      // Thông báo cho client của user này biết phiên đã hết hạn
      io.to(`showtime_${showtime_id}`).emit('reservationExpired', {
        user_id,
        showtime_id,
        seat_ids
      });

    } catch (error) {
      console.error('Error handling session expiration:', error);
    }
  });

  // Xử lý khi thanh toán thành công
  socket.on('paymentCompleted', async (data) => {
    const { user_id, showtime_id, seat_ids } = data;

    try {
      // Tại đây bạn sẽ chuyển BlockSeat thành đơn hàng thực sự
      // Ví dụ: tạo booking record, chuyển trạng thái ghế thành booked, v.v.
      
      // Xóa các block ghế đã đặt thành công
      await BlockSeat.destroy({
        where: {
          user_id: parseInt(user_id),
          showtime_id: parseInt(showtime_id),
          seat_id: { [Op.in]: seat_ids }
        }
      });

      // Thông báo cho tất cả clients trong cùng showtime
      io.to(`showtime_${showtime_id}`).emit('seatBooked', {
        permanent: true, // Đánh dấu đây là đặt ghế vĩnh viễn
        seat_ids,
        showtime_id,
        user_id
      });

    } catch (error) {
      console.error('Error handling payment completion:', error);
    }
  });
};

module.exports = {
  handleSeatSocket,
  startCleanupInterval
};
