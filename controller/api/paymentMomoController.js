const crypto = require('crypto');
const https = require('https');
require('dotenv').config();
const { Payment, Booking, Ticket, BookingSeat, Seat, User, Showtime, Movie, Room } = require('../../models');
const { Op } = require('sequelize');

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
        const { amount = 50000, orderInfo = 'Thanh toán vé xem phim', booking_id, user_id, showtime_id } = req.body;
        
        // Tạo thông tin đơn hàng
        const orderId = `${MOMO_CONFIG.PARTNER_CODE}${Date.now()}`;
        const requestId = orderId;
        
        // Tạo extraData (mã hóa booking_id, user_id, showtime_id để sau này sử dụng)
        const extraData = Buffer.from(JSON.stringify({
            booking_id,
            user_id: user_id || req.user?.id,
            showtime_id
        })).toString('base64');
        
        const requestType = "payWithMethod";
        const autoCapture = true;
        const lang = 'vi';
        const orderGroupId = '';

        // Tạo raw signature
        const rawSignature = 
            "accessKey=" + MOMO_CONFIG.ACCESS_KEY + 
            "&amount=" + amount + 
            "&extraData=" + extraData + 
            "&ipnUrl=" + MOMO_CONFIG.IPN_URL + 
            "&orderId=" + orderId + 
            "&orderInfo=" + orderInfo + 
            "&partnerCode=" + MOMO_CONFIG.PARTNER_CODE + 
            "&redirectUrl=" + MOMO_CONFIG.REDIRECT_URL + 
            "&requestId=" + requestId + 
            "&requestType=" + requestType;

        // Tạo signature
        const signature = crypto
            .createHmac('sha256', MOMO_CONFIG.SECRET_KEY)
            .update(rawSignature)
            .digest('hex');

        // Tạo request body
        const requestBody = JSON.stringify({
            partnerCode: MOMO_CONFIG.PARTNER_CODE,
            partnerName: "Test",
            storeId: "MomoTestStore",
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: MOMO_CONFIG.REDIRECT_URL,
            ipnUrl: MOMO_CONFIG.IPN_URL,
            lang: lang,
            requestType: requestType,
            autoCapture: autoCapture,
            extraData: extraData,
            orderGroupId: orderGroupId,
            signature: signature
        });

        // Gửi request đến MOMO
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

        const momoRequest = https.request(options, async (momoResponse) => {
            let data = '';
            momoResponse.setEncoding('utf8');
            
            momoResponse.on('data', (chunk) => {
                data += chunk;
            });
            
            momoResponse.on('end', async () => {
                const response = JSON.parse(data);
                
                // Lưu thông tin thanh toán vào database
                try {
                    await Payment.create({
                        orderId,
                        amount,
                        orderInfo,
                        paymentType: 'MOMO',
                        status: 'PENDING',
                        user_id: req.user?.id || user_id,
                        booking_id,
                        showtime_id,
                        extraData,
                        responseData: JSON.stringify(response)
                    });
                    
                    // Trả về kết quả cho client
                    res.json(response);
                } catch (dbError) {
                    console.error('Lỗi khi lưu thông tin thanh toán:', dbError);
                    res.status(500).json({
                        error: 'Có lỗi xảy ra khi lưu thông tin thanh toán',
                        message: dbError.message
                    });
                }
            });
        });
        
        momoRequest.on('error', (error) => {
            console.error('Lỗi khi gửi request đến MOMO:', error);
            res.status(500).json({
                error: 'Có lỗi xảy ra khi kết nối đến MOMO',
                message: error.message
            });
        });
        
        // Gửi request
        momoRequest.write(requestBody);
        momoRequest.end();
        
    } catch (error) {
        console.error('Lỗi khi tạo thanh toán MOMO:', error);
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
        
        // Cập nhật trạng thái thanh toán
        const payment = await Payment.findOne({ where: { orderId } });
        
        if (!payment) {
            console.error('Payment not found for orderId:', orderId);
            return res.status(200).json({ message: 'Payment not found but accepting callback' });
        }

        // Giải mã extraData nếu có
        let bookingData = {};
        if (extraData) {
            try {
                const decodedData = Buffer.from(extraData, 'base64').toString();
                bookingData = JSON.parse(decodedData);
            } catch (error) {
                console.error("Lỗi khi giải mã extraData:", error);
            }
        }

        const { booking_id, user_id, showtime_id } = bookingData;

        if (resultCode === 0) {
            // Thanh toán thành công
            await payment.update({
                status: 'SUCCESS',
                transactionId: transId,
                paymentTime: responseTime,
                responseData: JSON.stringify(req.body)
            });

            // Cập nhật trạng thái đặt vé
            if (booking_id) {
                try {
                    // Cập nhật trạng thái booking
                    await Booking.update(
                        { 
                            status: 'CONFIRMED', 
                            payment_status: 'PAID',
                            payment_time: new Date(responseTime),
                            payment_method: 'MOMO'
                        },
                        { where: { id: booking_id } }
                    );
                    
                    // Tạo vé điện tử
                    await generateTickets(booking_id);
                    
                } catch (error) {
                    console.error("Lỗi khi cập nhật booking:", error);
                }
            }
        } else {
            // Thanh toán thất bại
            await payment.update({
                status: 'FAILED',
                responseData: JSON.stringify(req.body),
                error_message: message
            });
                        
            // Cập nhật trạng thái đặt vé thành thất bại
            if (booking_id) {
                try {
                    await Booking.update(
                        { 
                            status: 'PAYMENT_FAILED', 
                            payment_status: 'FAILED',
                            payment_message: message
                        },
                        { where: { id: booking_id } }
                    );
                    
                    // Giải phóng ghế đã đặt
                    await releaseBookedSeats(booking_id, showtime_id);
                } catch (error) {
                    console.error("Lỗi khi cập nhật booking thất bại:", error);
                }
            }
        }

        // Luôn trả về 200 cho MoMo để nó không gửi lại request
        res.status(200).json({ message: 'Processed' });
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
        
        // Tìm thông tin thanh toán cơ bản trước
        const payment = await Payment.findOne({ 
            where: { orderId },
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin thanh toán'
            });
        }
        
        // Nếu có booking_id, tìm thêm thông tin booking trong truy vấn riêng
        let bookingData = null;
        if (payment.booking_id) {
            try {
                const booking = await Booking.findByPk(payment.booking_id, {
                    attributes: ['id', 'status', 'total_amount', 'seat_count']
                });
                
                if (booking) {
                    bookingData = {
                        id: booking.id,
                        status: booking.status,
                        total_amount: booking.total_amount,
                        seat_count: booking.seat_count
                    };
                    
                    // Nếu có showtime_id, lấy thông tin showtime
                    if (payment.showtime_id) {
                        const showtime = await Showtime.findByPk(payment.showtime_id, {
                            attributes: ['id', 'start_time'],
                            include: [
                                { 
                                    model: Movie, 
                                    attributes: ['id', 'name', 'poster'] 
                                },
                                { 
                                    model: Room, 
                                    attributes: ['id', 'name'] 
                                }
                            ]
                        });
                        
                        if (showtime) {
                            bookingData.movie = showtime.Movie ? showtime.Movie.name : null;
                            bookingData.movie_poster = showtime.Movie ? showtime.Movie.poster : null;
                            bookingData.showtime = showtime.start_time;
                            bookingData.cinema = showtime.Room ? showtime.Room.name : null;
                        }
                    }
                }
            } catch (error) {
                console.error("Lỗi khi lấy thông tin booking:", error);
            }
        }
        
        return res.json({
            success: true,
            data: {
                payment_id: payment.id,
                order_id: payment.orderId,
                payment_status: payment.status,
                transaction_id: payment.transactionId,
                payment_time: payment.paymentTime,
                amount: payment.amount,
                booking: bookingData
            }
        });
    } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra trạng thái thanh toán',
            error: error.message
        });
    }
};
