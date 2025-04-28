const socketIO = require('socket.io');

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.URL_CLIENT_BASE || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  // Lưu trữ thông tin về ghế đang được giữ
  const bookedSeats = new Map(); // Map để lưu trữ {seatId: {userId, timestamp}}

  // Thời gian timeout cho việc giữ ghế (ví dụ: 5 phút)
  const SEAT_TIMEOUT = 5 * 60 * 1000;

  // Hàm kiểm tra và xóa ghế hết hạn
  const clearExpiredSeats = (showtime_id) => {
    const now = Date.now();
    for (const [seatId, booking] of bookedSeats.entries()) {
      if (booking.showtime_id === showtime_id && now - booking.timestamp > SEAT_TIMEOUT) {
        bookedSeats.delete(seatId);
        io.to(`showtime_${showtime_id}`).emit('seatUnbooked', { seat_id: seatId });
      }
    }
  };

  io.on('connection', (socket) => {
    const { userType, showtime_id } = socket.handshake.query;
    // Thêm socket vào room của showtime
    if (showtime_id) {
      socket.join(`showtime_${showtime_id}`);
    }

    // Xử lý sự kiện đặt ghế
    socket.on('bookSeat', async (data, callback) => {
      const { seat_id, showtime_id } = data;
      
      try {
        // Kiểm tra xem ghế đã được đặt chưa
        if (bookedSeats.has(seat_id)) {
          const booking = bookedSeats.get(seat_id);
          // Nếu người dùng hiện tại là người đã đặt ghế này
          if (booking.socketId === socket.id) {
            callback({ success: true });
            return;
          }
          // Nếu ghế đã được người khác đặt
          callback({ 
            success: false, 
            message: 'Ghế này đã được người khác chọn' 
          });
          return;
        }

        // Lưu thông tin đặt ghế
        bookedSeats.set(seat_id, {
          socketId: socket.id,
          timestamp: Date.now(),
          showtime_id
        });

        // Thông báo cho tất cả clients trong cùng showtime
        io.to(`showtime_${showtime_id}`).emit('seatBooked', {
          seat_id,
          showtime_id
        });

        callback({ success: true });

        // Đặt timeout để tự động hủy ghế
        setTimeout(() => {
          if (bookedSeats.has(seat_id) && 
              bookedSeats.get(seat_id).socketId === socket.id) {
            bookedSeats.delete(seat_id);
            io.to(`showtime_${showtime_id}`).emit('seatUnbooked', {
              seat_id,
              showtime_id
            });
          }
        }, SEAT_TIMEOUT);

      } catch (error) {
        console.error('Error booking seat:', error);
        callback({ 
          success: false, 
          message: 'Có lỗi xảy ra khi đặt ghế' 
        });
      }
    });

    // Xử lý sự kiện hủy đặt ghế
    socket.on('unbookSeat', (data) => {
      const { seat_id, showtime_id } = data;
      
      if (bookedSeats.has(seat_id) && 
          bookedSeats.get(seat_id).socketId === socket.id) {
        bookedSeats.delete(seat_id);
        io.to(`showtime_${showtime_id}`).emit('seatUnbooked', {
          seat_id,
          showtime_id
        });
      }
    });

    // Xử lý ngắt kết nối
    socket.on('disconnect', () => {      
      // Tìm và hủy tất cả ghế của user này
      for (const [seatId, booking] of bookedSeats.entries()) {
        if (booking.socketId === socket.id) {
          bookedSeats.delete(seatId);
          io.to(`showtime_${booking.showtime_id}`).emit('seatUnbooked', {
            seat_id: seatId,
            showtime_id: booking.showtime_id
          });
        }
      }
    });
  });

  // Chạy định kỳ để dọn dẹp các ghế hết hạn
  setInterval(() => {
    const showtimes = new Set([...bookedSeats.values()].map(b => b.showtime_id));
    showtimes.forEach(showtime_id => clearExpiredSeats(showtime_id));
  }, 60000); // Kiểm tra mỗi phút

  return io;
}

module.exports = initializeSocket; 