const crypto = require('crypto');
const https = require('https');
require('dotenv').config();
const { Payment, Booking, Ticket, BookingSeat, Seat, User, Showtime, Movie, Room } = require('../../models');
const { Op } = require('sequelize');
const orderService = require('../../service/orderService');

// Cấu hình MOMO
const MOMO_CONFIG = {
    ACCESS_KEY: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
    SECRET_KEY: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    PARTNER_CODE: process.env.MOMO_PARTNER_CODE || 'MOMO',
    REDIRECT_URL: process.env.CLIENT_URL || 'http://localhost:5173/payment-result',
    IPN_URL: process.env.MOMO_IPN_URL || 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b'
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
        // Gọi service để xử lý thanh toán
        const result = await orderService.payWithMoMo(data);
        
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
            
            console.log(`Đã tạo vé với mã ${ticketCode} cho ghế ${bookingSeat.Seat.name}`);
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
            console.log('Không tìm thấy ghế nào để giải phóng cho booking:', booking_id);
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
        
        console.log(`Đã giải phóng ${seatIds.length} ghế cho booking ${booking_id}`);
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
