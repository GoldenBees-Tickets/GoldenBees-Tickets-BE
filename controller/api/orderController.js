const crypto = require('crypto');
const https = require('https');
require('dotenv').config();
const { Payment, Booking, Ticket, BookingSeat, Seat, User, Showtime, Movie, Room } = require('../../models');
const { Op } = require('sequelize');
const orderService = require('../../service/orderService');

// Cấu hình MOMO
const MOMO_CONFIG = {
    ACCESS_KEY: process.env.MOMO_ACCESS_KEY,
    SECRET_KEY: process.env.MOMO_SECRET_KEY,
    PARTNER_CODE: process.env.MOMO_PARTNER_CODE,
    REDIRECT_URL: process.env.CLIENT_URL,
    IPN_URL: process.env.MOMO_IPN_URL
};

// Tạo signature cho MOMO
const createMoMoSignature = (data) => {
    const rawSignature = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('&');

    const signature = crypto
        .createHmac('sha256', MOMO_CONFIG.SECRET_KEY)
        .update(rawSignature)
        .digest('hex');

    return signature;
};

// Gửi request đến MOMO
const sendMoMoRequest = (requestBody) => {
    return new Promise((resolve, reject) => {
    const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };

    const httpReq = https.request(options, response => {
            let data = '';
        response.setEncoding('utf8');
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve(JSON.parse(data)));
        });

        httpReq.on('error', reject);
        httpReq.write(requestBody);
        httpReq.end();
    });
};

// Controller thanh toán với MOMO
exports.payWithMoMo = async (req, res) => {
    try {
        const data = req.body;        
        // Kiểm tra dữ liệu đầu vào chi tiết
        if (!data.user_id) {
            console.error('Missing user_id in payment request');
            return res.status(400).json({
                error: 'Dữ liệu thanh toán không đầy đủ',
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        if (!data.total || !data.amount) {
            console.error('Missing total or amount in payment request');
            return res.status(400).json({
                error: 'Dữ liệu thanh toán không đầy đủ',
                message: 'Không tìm thấy thông tin số tiền thanh toán'
            });
        }

        if (!data.seat_ids || !Array.isArray(data.seat_ids) || data.seat_ids.length === 0) {
            console.error('Missing or invalid seat_ids in payment request');
            return res.status(400).json({
                error: 'Dữ liệu thanh toán không đầy đủ',
                message: 'Không tìm thấy thông tin ghế đã chọn'
            });
        }

        if (!data.showtime_id) {
            console.error('Missing showtime_id in payment request');
            return res.status(400).json({
                error: 'Dữ liệu thanh toán không đầy đủ',
                message: 'Không tìm thấy thông tin suất chiếu'
            });
        }

        // Chuẩn bị dữ liệu trước khi gửi đến service
        const preparedData = {
            ...data,
            // Xử lý showtime_id để đảm bảo là một ID đơn giản
            showtime_id: typeof data.showtime_id === 'object' ? data.showtime_id.id : data.showtime_id,
            orderInfo: data.orderInfo || `Thanh toán vé xem phim`
        };
        
        // Gọi service để xử lý thanh toán
        const result = await orderService.payWithMoMo(preparedData);        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({
                error: result.error,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Lỗi khi gọi service thanh toán MOMO:', error);
        res.status(500).json({
            error: 'Có lỗi xảy ra khi xử lý thanh toán',
            message: error.message
        });
    }
};

// Xử lý callback từ MOMO
exports.handleCallback = async (req, res) => {
    try {
        const {
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature
        } = req.body;
        
        // Chuyển dữ liệu callback từ MoMo đến service
        const result = await orderService.handleCallback(req.body);
        
        // Nếu thanh toán thành công, tạo mã QR
        if (resultCode === '0' || resultCode === 0) {            
            // Order đã được cập nhật trong orderService.handleCallback
            
            // Kiểm tra kết quả gửi email
            if (result.sendEmail) {
                if (result.sendEmail.emailResult && result.sendEmail.emailResult.success) {
                } else {
                    console.error('Failed to send email with QR code:', 
                        result.sendEmail.emailResult ? result.sendEmail.emailResult.message : 'Unknown error');
                }
            } else {
                console.warn('No email sending result found in callback response');
            }
            
            // Có thể thêm webhook để thông báo cho client biết về thanh toán thành công
            // Ví dụ: gửi socket hoặc thông báo push
        } else {
        }
        
        // Luôn trả về 200 cho MoMo để nó không gửi lại request
        res.status(200).json({ message: result.message || 'Processed' });
    } catch (error) {
        console.error('Lỗi khi xử lý callback MOMO:', error);
        // Vẫn trả về 200 để MoMo không gửi lại request
        res.status(200).json({ message: 'Error occurred but processed' });
    }
};

// Hàm tạo vé điện tử
const generateTickets = async (booking_id) => {
    try {
        // Lấy thông tin đặt vé
        const booking = await Booking.findByPk(booking_id, {
            include: [
                { model: BookingSeat, include: [Seat] },
                { model: Showtime, include: [Movie, Room] }
            ]
        });
        
        if (!booking) {
            console.error('Booking not found:', booking_id);
            return;
        }
        
        // Tạo vé cho từng ghế
        for (const bookingSeat of booking.BookingSeats) {
            const ticketCode = generateTicketCode();
            
            await Ticket.create({
                booking_id: booking.id,
                seat_id: bookingSeat.seat_id,
                user_id: booking.user_id,
                showtime_id: booking.showtime_id,
                ticket_code: ticketCode,
                status: 'ACTIVE',
                created_at: new Date()
            });
                    }
    } catch (error) {
        console.error('Lỗi khi tạo vé:', error);
    }
};

// Hàm giải phóng ghế khi thanh toán thất bại
const releaseBookedSeats = async (booking_id, showtime_id) => {
    try {
        // Lấy danh sách ghế từ booking
        const bookingSeats = await BookingSeat.findAll({
            where: { booking_id }
        });
        
        if (bookingSeats.length === 0) {
            return;
        }
        
        // Lấy ID của các ghế cần giải phóng
        const seatIds = bookingSeats.map(bs => bs.seat_id);
        
        // Cập nhật trạng thái ghế về AVAILABLE
        await Seat.update(
            { status: 'AVAILABLE' },
            { 
                where: { 
                    id: { [Op.in]: seatIds },
                    showtime_id
                } 
            }
        );
    } catch (error) {
        console.error('Lỗi khi giải phóng ghế:', error);
    }
};

// Hàm tạo mã vé ngẫu nhiên
const generateTicketCode = () => {
    return 'TIX' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
};

// Thêm API check payment status
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;        
        // Gọi service để kiểm tra trạng thái thanh toán
        const result = await orderService.checkPaymentStatus(orderId);
        
        // Trả về kết quả truy vấn cho client
        res.json(result);
    } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra trạng thái thanh toán',
            error: error.message
        });
    }
};

// Xử lý callback từ client sau khi thanh toán MoMo
exports.handleClientCallback = async (req, res) => {
    try {
        const {
            orderId,
            resultCode,
            message,
            extraData
        } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin đơn hàng',
                error: 'Missing orderId'
            });
        }

        // Xử lý trường hợp MoMo không gửi callback webhook
        // Chuyển dữ liệu đến service để xử lý
        const callbackData = {
            orderId,
            resultCode,
            message,
            extraData
        };
        
        const result = await orderService.handleCallback(callbackData);
                
        res.status(200).json({
            success: result.success,
            message: result.message || 'Đã xử lý',
            data: {
                orderId,
                status: result.success ? 'success' : 'error'
            }
        });
    } catch (error) {
        console.error('Lỗi khi xử lý client callback:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xử lý callback',
            error: error.message
        });
    }
};
