const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment');
const vnpayConfig = require('../config/vnpayConfig');

/**
 * VNPay Service
 * Xử lý logic liên quan đến thanh toán VNPay
 */
const vnpayService = {
  /**
   * Tạo URL thanh toán VNPay
   * @param {Object} paymentData Dữ liệu thanh toán
   * @returns {Object} Kết quả với URL thanh toán
   */
  createPaymentUrl: (paymentData) => {
    try {
      // Thiết lập timezone
      process.env.TZ = 'Asia/Ho_Chi_Minh';
      
      // Lấy thông tin thanh toán
      const { 
        orderId, 
        amount, 
        orderInfo, 
        ipAddr, 
        bankCode = '', 
        orderType = 'other',
        language = 'vn'
      } = paymentData;
      
      // Tạo ngày tạo giao dịch
      const createDate = moment().format('YYYYMMDDHHmmss');
      
      // Tạo các tham số thanh toán
      const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: vnpayConfig.vnp_TmnCode,
        vnp_Locale: language,
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: orderType,
        vnp_Amount: amount * 100, // VNPay yêu cầu số tiền x100
        vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate
      };
      
      // Thêm mã ngân hàng nếu có
      if (bankCode && bankCode !== '') {
        vnpParams.vnp_BankCode = bankCode;
      }
      
      // Sắp xếp tham số theo thứ tự a-z
      const sortedParams = vnpayService.sortObject(vnpParams);
      
      // Tạo chuỗi ký
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
      const secureHash = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");
      
      // Thêm chữ ký vào tham số
      sortedParams.vnp_SecureHash = secureHash;
      
      // Tạo URL thanh toán
      const paymentUrl = `${vnpayConfig.vnp_Url}?${querystring.stringify(sortedParams, { encode: false })}`;
      
      return {
        success: true,
        orderId,
        paymentUrl: paymentUrl
      };
    } catch (error) {
      console.error('Error creating VNPay payment URL:', error);
      return {
        success: false,
        message: error.message || 'Failed to create payment URL'
      };
    }
  },
  
  /**
   * Xác thực callback từ VNPay
   * @param {Object} vnpParams Tham số từ VNPay trả về
   * @returns {Object} Kết quả xác thực
   */
  verifyReturnUrl: (vnpParams) => {
    try {      
      // Nếu không có tham số hoặc không có mã bảo mật
      if (!vnpParams || !vnpParams.vnp_SecureHash) {
        return {
          isValid: false,
          isSuccessful: false,
          error: 'Missing secure hash'
        };
      }
      
      // Lấy chữ ký từ tham số
      const secureHash = vnpParams.vnp_SecureHash;
      
      // Tạo bản sao tham số để xử lý
      const params = { ...vnpParams };
      
      // Xóa các tham số không cần thiết
      delete params.vnp_SecureHash;
      delete params.vnp_SecureHashType;
      
      // Sắp xếp tham số
      const sortedParams = vnpayService.sortObject(params);
      
      // Tạo chuỗi ký
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
      const calculatedHash = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");
      
      // So sánh chữ ký
      const isValid = secureHash === calculatedHash;
      
      // Tạo kết quả
      const result = {
        isValid: isValid,
        isSuccessful: vnpParams.vnp_ResponseCode === '00',
        data: {
          orderId: vnpParams.vnp_TxnRef,
          amount: parseInt(vnpParams.vnp_Amount) / 100, // Chuyển về VND
          orderInfo: vnpParams.vnp_OrderInfo,
          responseCode: vnpParams.vnp_ResponseCode,
          transactionNo: vnpParams.vnp_TransactionNo,
          bankCode: vnpParams.vnp_BankCode,
          payDate: vnpParams.vnp_PayDate,
          cardType: vnpParams.vnp_CardType,
          bankTranNo: vnpParams.vnp_BankTranNo
        }
      };
      
      return result;
    } catch (error) {
      console.error('Error verifying VNPay return:', error);
      return {
        isValid: false,
        isSuccessful: false,
        error: error.message || 'Failed to verify payment result'
      };
    }
  },
  
  /**
   * Xử lý IPN từ VNPay
   * @param {Object} ipnData Dữ liệu IPN
   * @returns {Object} Kết quả xử lý IPN
   */
  processIpn: (ipnData) => {
    try {      
      // Lấy chữ ký
      const secureHash = ipnData.vnp_SecureHash;
      
      // Nếu không có mã bảo mật
      if (!secureHash) {
        return { RspCode: '97', Message: 'Missing signature' };
      }
      
      // Tạo bản sao tham số
      const params = { ...ipnData };
      
      // Xóa các tham số không cần thiết
      delete params.vnp_SecureHash;
      delete params.vnp_SecureHashType;
      
      // Sắp xếp tham số
      const sortedParams = vnpayService.sortObject(params);
      
      // Tạo chuỗi ký
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
      const calculatedHash = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");
      
      // So sánh chữ ký
      if (secureHash !== calculatedHash) {
        return { RspCode: '97', Message: 'Invalid signature' };
      }
      
      // Lấy thông tin từ IPN
      const orderId = ipnData.vnp_TxnRef;
      const amount = parseInt(ipnData.vnp_Amount) / 100;
      const responseCode = ipnData.vnp_ResponseCode;
      
      // Trả về kết quả xử lý theo yêu cầu của VNPay
      return { RspCode: '00', Message: 'Confirmed' };
    } catch (error) {
      console.error('Error processing VNPay IPN:', error);
      return { RspCode: '99', Message: 'Unknown error' };
    }
  },
  
  /**
   * Sắp xếp object theo key
   * @param {Object} obj Object cần sắp xếp
   * @returns {Object} Object đã sắp xếp
   */
  sortObject: (obj) => {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
  }
};

module.exports = vnpayService; 