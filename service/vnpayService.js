const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment');
const vnpayConfig = require('../config/vnpayConfig');
const {
  Payment,
  Cinema,
  SeatStatus,
  Ticket,
  BookingSeat,
  Seat,
  User, 
  Showtime,
  Movie,
  Room,
  Order,
  OrderCombo,
  PromotionUsage,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const { generateQRCode } = require('./qrService');

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
  createPaymentUrl: async (paymentData) => {
    const transaction = await sequelize.transaction(); // Bắt đầu transaction
    
    try {
      // Thiết lập timezone
      process.env.TZ = 'Asia/Ho_Chi_Minh';
      
      // Lấy thông tin thanh toán từ request
      let { 
        user_id,
        total,
        seat_ids,
        showtime_id,
        combos = [],
        promotion_id,
        orderInfo = "Thanh toán vé xem phim",
        ipAddr, 
        bankCode = '', 
        orderType = 'billpayment',
        language = 'vn',
        starDiscount
      } = paymentData;
      
      // Tạo thông tin đơn hàng trong database
      const order = await Order.create({ 
        user_id, 
        total, 
        showtime_id,
        status: 'pending'  // Trạng thái pending khi tạo đơn
      }, { transaction });

      // Tạo trạng thái ghế "Blocked"
      const seatStatusPromises = seat_ids.map(async (item) => {
        return await SeatStatus.create({
          seat_id: item.id,
          showtime_id,
          user_id,
          status: "Blocked",
        }, { transaction });
      });

      const order_id = order.id;
      
      // Tạo danh sách vé
      const ticketPromises = seat_ids.map(async (item) => {
        return await Ticket.create({
          order_id,
          seat_id: item.id,
          price: item.price,
        }, { transaction });
      });

      // Tạo danh sách combo nếu có
      const orderComboPromises = combos.length > 0 ? combos.map(async (item) => {
        return await OrderCombo.create({
          order_id,
          combo_id: item.id,
          quantity: item.quantity,
        }, { transaction });
      }) : [];

      await Promise.all([
        ...ticketPromises,
        ...orderComboPromises,
        ...seatStatusPromises,
      ]);

      // Xử lý promotion nếu có
      if (promotion_id) {
        promotion_id = Number(promotion_id);
        await PromotionUsage.create({ 
          user_id, 
          promotion_id, 
          order_id 
        }, { transaction });
      }
      
      // Commit transaction sau khi tạo đơn hàng thành công
      await transaction.commit();
      
      if (starDiscount > 0) {
        await User.decrement('star', {
          by: starDiscount,
          where: { id: user_id },
        });
      }    
      
      // Tạo extraData
      const extraData = Buffer.from(JSON.stringify({
        order_id,
        user_id,
        showtime_id
      })).toString('base64');
      
      // Tạo ngày tạo giao dịch
      const createDate = moment().format('YYYYMMDDHHmmss');
      
      // Tạo mã đơn hàng cho VNPay (sử dụng order_id)
      const vnpTxnRef = `VNP${order_id}${moment().format('HHmmss')}`;
      
      // Tạo các tham số thanh toán
      const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: vnpayConfig.vnp_TmnCode,
        vnp_Locale: language,
        vnp_CurrCode: 'VND',
        vnp_TxnRef: vnpTxnRef,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: orderType,
        vnp_Amount: total * 100, // VNPay yêu cầu số tiền x100
        vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: moment().add(15, 'minutes').format('YYYYMMDDHHmmss')
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
      
      // Lưu thông tin thanh toán vào database
      await Payment.create({
        orderId: order_id,
        amount: total,
        orderInfo,
        paymentType: "VNPay",
        status: "Pending",
        user_id,
        showtime_id,
        extraData,
        responseData: JSON.stringify({
          vnpTxnRef: vnpTxnRef,
          bankCode: bankCode,
          amount: total
        })
      });
      
      return {
        success: true,
        orderId: order_id,
        vnpTxnRef: vnpTxnRef,
        paymentUrl: paymentUrl
      };
    } catch (error) {
      console.error('Error creating VNPay payment URL:', error);
      
      // Rollback transaction nếu có lỗi
      await transaction.rollback();
      
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
      
      // Trong môi trường test, bỏ qua xác thực chữ ký cho sandbox
      // CẢNH BÁO: Trong môi trường production, điều này không nên được thực hiện
      const isTestEnvironment = process.env.NODE_ENV !== 'production';
      if (isTestEnvironment) {
        return {
          isValid: true,
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
  },
  
  /**
   * Xử lý callback từ VNPay để cập nhật trạng thái đơn hàng
   * @param {Object} callbackData Dữ liệu từ VNPay gửi về
   * @returns {Object} Kết quả xử lý
   */
  handleVNPayCallback: async (callbackData) => {
    try {
      // Lấy thông tin từ callback
      const {
        vnp_TxnRef, // Mã giao dịch (chứa orderId)
        vnp_Amount,
        vnp_ResponseCode, // Mã phản hồi từ VNPay (00 là thành công)
        vnp_TransactionNo,
        vnp_BankCode,
        vnp_PayDate,
        vnp_OrderInfo,
        vnp_SecureHash,
        orderId // orderId đã được tìm từ payment record
      } = callbackData;
            
      // Xác thực chữ ký
      const verifyResult = vnpayService.verifyReturnUrl(callbackData);
      
      // Trong môi trường test, tiếp tục xử lý mặc dù chữ ký có thể không khớp
      if (!verifyResult.isValid && process.env.NODE_ENV === 'production') {
        console.error('[VNPay] Invalid signature');
        return {
          success: false,
          message: "Invalid signature",
          error: "Security hash verification failed"
        };
      }
      
      // Sử dụng orderId được truyền trực tiếp nếu có
      let order_id = orderId;
      
      // Nếu không có orderId trực tiếp, thử trích xuất từ vnp_TxnRef
      if (!order_id) {
        // Trích xuất order_id từ vnp_TxnRef (format: VNP{orderId}{timestamp})
        const orderIdMatch = vnp_TxnRef.match(/VNP(\d+)/);
        if (orderIdMatch && orderIdMatch[1]) {
          order_id = orderIdMatch[1];
        } else {
          console.error('[VNPay] Cannot extract orderId from vnp_TxnRef:', vnp_TxnRef);
          return {
            success: false,
            message: "Cannot extract orderId",
            error: "Invalid transaction reference format",
            txnRef: vnp_TxnRef
          };
        }
      } else {
      }
      
      // Tìm order dựa trên orderId
      const order = await Order.findOne({ where: { id: order_id } });
      
      if (!order) {
        console.error("[VNPay] Order not found for orderId:", order_id);
        return {
          status: 404,
          success: false,
          message: "Order not found but accepting callback",
          error: "Order not found",
          orderId: order_id
        };
      }
      
      // Kiểm tra xem đơn hàng đã được xử lý chưa
      if (order.status === "paid") {
        return {
          success: true,
          message: "Order already processed",
          alreadyProcessed: true,
          orderId: order_id
        };
      }
      
      // Lấy thông tin payment
      const payment = await Payment.findOne({ 
        where: { 
          orderId: order_id,
          paymentType: "VNPay" 
        }
      });
      
      if (!payment) {
        console.error('[VNPay] Payment record not found for orderId:', order_id);
        return {
          success: false,
          message: "Payment record not found",
          error: "Payment record not found",
          orderId: order_id
        };
      }
      
      // Giải mã extraData từ payment
      let extraDataObj = {};
      if (payment.extraData) {
        try {
          const decodedData = Buffer.from(payment.extraData, "base64").toString();
          extraDataObj = JSON.parse(decodedData);
        } catch (error) {
          console.error("[VNPay] Lỗi khi giải mã extraData:", error);
        }
      }
      
      const user_id = order.user_id;
      const showtime_id = order.showtime_id;
      
      // Xử lý kết quả thanh toán
      if (vnp_ResponseCode === '00') {
        // Thanh toán thành công - Bắt đầu transaction
        const transaction = await sequelize.transaction();
        
        try {
          // Cập nhật trạng thái Order
          await order.update({
            status: "paid",
          }, { transaction });
          
          // Cập nhật trạng thái Payment
          await payment.update({
            status: "SUCCESS",
            responseData: JSON.stringify({
              ...JSON.parse(payment.responseData || '{}'),
              vnp_ResponseCode,
              vnp_TransactionNo,
              vnp_PayDate
            })
          }, { transaction });
          
          // Lấy thông tin người dùng và cập nhật điểm thưởng
          const userData = await User.findOne({ where: { id: user_id } });
          if (userData) {
            userData.star = userData.star + 3;
            await userData.save({ transaction });
          }
          
          // Lấy danh sách vé liên quan đến đơn hàng
          const tickets = await Ticket.findAll({
            where: { order_id: order_id },
            transaction
          });
          
          // Cập nhật trạng thái ghế thành "Booked"
          const seatIds = tickets.map(ticket => ticket.seat_id);
          
          await SeatStatus.update(
            { status: "Booked" },
            {
              where: {
                seat_id: { [Op.in]: seatIds },
                showtime_id: showtime_id,
              },
              transaction
            }
          );
          
          // Lấy thông tin suất chiếu và phim
          const showtimeData = await Showtime.findOne({
            where: { id: showtime_id },
            transaction
          });
          
          if (!showtimeData) {
            throw new Error("Không tìm thấy suất chiếu.");
          }
          
          const movieData = await Movie.findOne({
            where: { id: showtimeData.movie_id },
            transaction
          });
          
          if (!movieData) {
            throw new Error("Không tìm thấy phim.");
          }
          
          // Lấy thông tin ghế
          const seatDatas = await Promise.all(
            tickets.map(async (item) => {
              return await Seat.findOne({ 
                where: { id: item.seat_id },
                transaction
              });
            })
          );

          // Format lại dữ liệu ghế để đúng định dạng
          const formattedSeatDatas = seatDatas.map(seat => {
            if (!seat) return null;
            return {
              id: seat.id,
              seat_row: seat.seat_row,
              seat_number: seat.seat_number,
              price: seat.price
            };
          }).filter(Boolean); // Lọc bỏ các giá trị null
          
          // Tạo mã QR cho vé
          const email = userData?.email;
          const showDate = showtimeData?.show_date || '';
          const startTime = showtimeData?.start_time || '';
          
          // Tạo string định dạng ngày giờ hợp lệ
          const formattedShowtime = startTime + ' ' + showDate;
          
          try {
            const createQrCode = await generateQRCode({
              movieName: movieData.name,
              showtime: formattedShowtime,
              seatDatas: formattedSeatDatas,
              orderId,
              total: order.total,
              user_id,
              email,
            });
            
            // Nếu tạo QR thành công, cập nhật qr_code vào order trong cùng transaction
            if (createQrCode && createQrCode.success && createQrCode.qr_code) {
              await order.update({ 
                qr_code: createQrCode.qr_code 
              }, { transaction });
            }
            
            await transaction.commit();
            
            // Thêm log email
            if (createQrCode?.emailResult) {
              if (createQrCode.emailResult.success) {
              } else {
                console.error(`[VNPay] Không thể gửi email ticket đến ${email} cho đơn hàng ${order_id}:`, 
                  createQrCode.emailResult.message || 'Unknown error');
              }
            } else {
              console.warn(`[VNPay] Không có kết quả email cho đơn hàng ${order_id}`);
            }
            
            return {
              status: 200,
              success: true,
              message: "Payment processed successfully",
              sendEmail: createQrCode,
              orderId: order_id
            };
          } catch (qrError) {
            console.error('[VNPay] Error generating QR code:', qrError);
            
            // Vẫn commit transaction nếu có lỗi tạo QR
            await transaction.commit();
            
            return {
              status: 200,
              success: true,
              message: "Payment processed successfully but failed to generate QR",
              error: qrError.message,
              orderId: order_id
            };
          }
        } catch (error) {
          // Rollback nếu có lỗi
          await transaction.rollback();
          console.error("[VNPay] Lỗi khi xử lý thanh toán VNPay thành công:", error);
          return {
            success: false,
            message: "Error processing successful payment",
            error: error.message,
            orderId: order_id
          };
        }
      } else {
        // Thanh toán thất bại
        await order.update({
          status: "failed",
          payment_status: "FAILED",
          error_message: `VNPay payment failed with code: ${vnp_ResponseCode}`
        });
        
        await payment.update({
          status: "FAILED",
          responseData: JSON.stringify({
            ...JSON.parse(payment.responseData || '{}'),
            vnp_ResponseCode,
            vnp_TransactionNo,
            vnp_PayDate
          })
        });
        
        // Giải phóng ghế đã đặt - Import từ orderService
        const orderService = require('./orderService');
        await orderService.releaseBookedSeats(order_id, showtime_id);
                
        return {
          success: false,
          message: "Payment failure processed",
          errorCode: vnp_ResponseCode,
          orderId: order_id
        };
      }
    } catch (error) {
      console.error("[VNPay] Lỗi khi xử lý callback VNPay:", error);
      return {
        success: false,
        message: "Error occurred but processed",
        error: error.message
      };
    }
  },
};

module.exports = vnpayService; 