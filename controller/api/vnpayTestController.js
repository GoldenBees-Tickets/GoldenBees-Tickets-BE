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
  createTestPayment: (req, res) => {
    try {
      // Lấy dữ liệu từ request hoặc sử dụng giá trị mặc định
      const orderId = `TEST${moment().format('YYYYMMDDHHmmss')}`;
      const amount = req.body.amount || 10000; // Mặc định 10,000 VND
      const orderInfo = req.body.orderInfo || `Thanh toan test don hang: ${orderId}`;
      const orderType = req.body.orderType || 'billpayment';
      const bankCode = req.body.bankCode || '';
      const language = req.body.language || 'vn';
      
      // Lấy IP của client
      const ipAddr = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    req.connection.socket.remoteAddress || '::1';
      
      
      // Tạo URL thanh toán
      const paymentData = {
        orderId,
        amount,
        orderInfo,
        orderType,
        ipAddr,
        bankCode,
        language
      };
      
      const result = vnpayService.createPaymentUrl(paymentData);
      
      if (result.success) {
        // Lưu thông tin đơn hàng (giả lập)
        
        return res.status(200).json({
          success: true,
          orderId: orderId,
          paymentUrl: result.paymentUrl
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || 'Could not create payment URL'
        });
      }
    } catch (error) {
      console.error('[VNPay Test] Error creating test payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
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
  }
};

module.exports = vnpayTestController; 