const vnpayService = require('../../service/vnpayService');
const moment = require('moment');

/**
 * Controller xử lý các request liên quan đến VNPay Test
 */
const vnpayTestController = {
  /**
   * Tạo URL thanh toán VNPay test với dữ liệu cứng
   * @param {Object} req Request
   * @param {Object} res Response
   */
  createTestPayment: async (req, res) => {
    try {      
      // Lấy dữ liệu từ request
      const { 
        amount, 
        orderInfo,
        orderType = 'billpayment',
        bankCode = '',
        language = 'vn',
        user_id,
        showtime_id,
        seat_ids,
        combos = [],
        promotion_id,
        starDiscount = 0
      } = req.body;
      
      // Kiểm tra các tham số bắt buộc
      if (!amount || !user_id || !showtime_id || !seat_ids) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin thanh toán: cần có amount, user_id, showtime_id và seat_ids'
        });
      }
      
      // Lấy IP của client
      const ipAddr = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    req.connection.socket.remoteAddress || '::1';
      
      // Chuẩn bị dữ liệu thanh toán
      const paymentData = {
        user_id,
        total: amount,
        seat_ids,
        showtime_id,
        combos,
        promotion_id,
        orderInfo: orderInfo || 'Thanh toán vé xem phim',
        ipAddr,
        bankCode,
        language,
        orderType,
        starDiscount,
      };
      
      // Gọi service tạo URL thanh toán
      const result = await vnpayService.createPaymentUrl(paymentData);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          orderId: result.orderId,
          vnpTxnRef: result.vnpTxnRef,
          paymentUrl: result.paymentUrl
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || 'Không thể tạo URL thanh toán'
        });
      }
    } catch (error) {
      console.error('[VNPay] Lỗi khi tạo thanh toán:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  },
  
  /**
   * Xử lý kết quả thanh toán VNPay
   * @param {Object} req Request
   * @param {Object} res Response
   */
  processPaymentReturn: (req, res) => {
    try {      
      // Xác thực kết quả thanh toán
      const vnpParams = req.query;
      const result = vnpayService.verifyReturnUrl(vnpParams);
      
      // Trả về kết quả
      return res.status(200).json(result);
    } catch (error) {
      console.error('[VNPay Test] Error processing payment return:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  
  /**
   * API endpoint để xác thực thanh toán (cho client)
   * @param {Object} req Request
   * @param {Object} res Response
   */
  verifyPayment: (req, res) => {
    try {
      // Xác thực kết quả thanh toán
      const vnpParams = req.query;
      
      // Nếu không có tham số, trả về lỗi
      if (!vnpParams || Object.keys(vnpParams).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No payment data provided'
        });
      }
      
      const result = vnpayService.verifyReturnUrl(vnpParams);
      
      // Trả về dữ liệu để client xử lý
      return res.status(200).json({
        ...vnpParams,
        vnp_Amount: parseInt(vnpParams.vnp_Amount) / 100, // Chuyển về VND
        success: result.isValid && result.isSuccessful,
        message: result.isValid 
          ? (result.isSuccessful ? 'Payment success' : 'Payment failed')
          : 'Invalid payment data'
      });
    } catch (error) {
      console.error('[VNPay Test] Error verifying payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  
  /**
   * Xử lý IPN từ VNPay
   * @param {Object} req Request
   * @param {Object} res Response
   */
  processIpn: (req, res) => {
    try {
      
      // Xử lý IPN
      const ipnData = req.query;
      const result = vnpayService.processIpn(ipnData);
      
      // Trả về kết quả theo định dạng VNPay yêu cầu
      return res.status(200).json(result);
    } catch (error) {
      console.error('[VNPay Test] Error processing IPN:', error);
      return res.status(500).json({ RspCode: '99', Message: 'Internal error' });
    }
  },
  
  /**
   * Xử lý callback từ VNPay và cập nhật trạng thái đơn hàng
   * @param {Object} req Request
   * @param {Object} res Response 
   */
  handleCallback: async (req, res) => {
    try {
      const callbackData = req.query; // VNPay sử dụng query params thay vì body
            
      // Kiểm tra dữ liệu callback cơ bản
      if (!callbackData || !callbackData.vnp_ResponseCode) {
        console.error('[VNPay CALLBACK] Dữ liệu callback không hợp lệ:', callbackData);
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu callback không hợp lệ'
        });
      }
      
      // Tìm đơn hàng dựa trên vnp_TxnRef
      const vnp_TxnRef = callbackData.vnp_TxnRef;
      
      // Tìm thanh toán với vnp_TxnRef trong responseData
      const Payment = require('../../models').Payment;
      const payment = await Payment.findOne({
        where: {
          paymentType: 'VNPay'
        },
        order: [['createdAt', 'DESC']]
      });
      
      let orderId;
      if (payment) {
        orderId = payment.orderId;
        
        // Cập nhật kết quả giao dịch vào payment record
        await payment.update({
          responseData: JSON.stringify({
            ...JSON.parse(payment.responseData || '{}'),
            callback: callbackData
          })
        });
      } else {
        console.error('[VNPay CALLBACK] Payment record not found for transaction reference:', vnp_TxnRef);
      }
      
      // Gọi service để xử lý callback với orderId đã tìm được
      if (orderId) {
        callbackData.orderId = orderId; // Thêm orderId vào dữ liệu callback
        const result = await vnpayService.handleVNPayCallback(callbackData);
        // Đã xử lý xong callback, tiếp tục với redirect
      } else {
        console.error('[VNPay CALLBACK] Cannot determine orderId for transaction');
      }
      
      // Kiểm tra mã phản hồi từ VNPay
      const isSuccess = callbackData.vnp_ResponseCode === '00';
      
      // Thông báo kết quả
      if (isSuccess) {
        // Redirect người dùng về trang thành công
        return res.redirect(`${process.env.CLIENT_URL}?orderId=${orderId || 'unknown'}`);
      } else {
        // Redirect người dùng về trang thất bại
        const message = encodeURIComponent('Thanh toán thất bại hoặc bị hủy');
        return res.redirect(`${process.env.CLIENT_URL_FAILED}/payment-failed?orderId=${orderId || 'unknown'}&message=${message}`);
      }
    } catch (error) {
      console.error('[VNPay CALLBACK] Error:', error);
      // Redirect về trang lỗi
      const message = encodeURIComponent('Có lỗi xảy ra khi xử lý thanh toán');
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-error?message=${message}`);
    }
  },
  
  /**
   * API endpoint để client kiểm tra kết quả thanh toán
   * @param {Object} req Request
   * @param {Object} res Response
   */
  checkPaymentStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin đơn hàng'
        });
      }
      
      // Gọi service để kiểm tra trạng thái thanh toán từ orderService
      const orderService = require('../../service/orderService');
      const result = await orderService.checkPaymentStatus(orderId);
      
      return res.json(result);
    } catch (error) {
      console.error('[VNPay] Lỗi khi kiểm tra trạng thái thanh toán:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra trạng thái thanh toán'
      });
    }
  }
};

module.exports = vnpayTestController; 