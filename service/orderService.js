const crypto = require("crypto");
const https = require("https");
require("dotenv").config();
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
  sequelize,
} = require("../models");
const { Op, where } = require("sequelize");
const { error } = require("console");
const { generateQRCode } = require("./qrService");

// Cấu hình MOMO
const MOMO_CONFIG = {
  ACCESS_KEY: process.env.MOMO_ACCESS_KEY,
  SECRET_KEY: process.env.MOMO_SECRET_KEY,

  PARTNER_CODE: process.env.MOMO_PARTNER_CODE,
  REDIRECT_URL: process.env.CLIENT_URL,
  IPN_URL: process.env.MOMO_IPN_URL,
};

const getOrderByUserId = async (user_id) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: Showtime,
          attributes: ["id", "start_time"],
          include: [
            {
              model: Movie,
              attributes: ["name", "poster", "age_rating"],
            },
            {
              model: Room,
              attributes: ["name"],
              include: [
                {
                  model: Cinema,
                  attributes: ["name"],
                },
              ],
            },
          ],
        },
      ],
      where: { user_id },
    });
    return { status: 200, success: true, error: null, data: orders };
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAllOrders = async () => {
  try {
    const orders = await Order.findAll();
    return { status: 200, success: true, error: null, data: orders };
  } catch (error) {
    throw new Error(error.message);
  }
};
// Tạo signature cho MOMO
const createMoMoSignature = (data) => {
  const rawSignature = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");

  const signature = crypto
    .createHmac("sha256", MOMO_CONFIG.SECRET_KEY)
    .update(rawSignature)
    .digest("hex");

  return signature;
};

// Gửi request đến MOMO
const sendMoMoRequest = (requestBody) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "test-payment.momo.vn",
      port: 443,
      path: "/v2/gateway/api/create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };

    const httpReq = https.request(options, (response) => {
      let data = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => resolve(JSON.parse(data)));
    });

    httpReq.on("error", reject);
    httpReq.write(requestBody);
    httpReq.end();
  });
};

// Service thanh toán với MOMO
const payWithMoMo = async (data) => {
  const transaction = await sequelize.transaction(); // Bắt đầu transaction

  try {
    let {
      user_id,
      total,
      seat_ids,
      showtime_id,
      combos,
      promotion_id,
      orderInfo = "Thanh toán vé xem phim",
    } = data;
    showtime_id = showtime_id.id;

    // Tạo thông tin đơn hàng
    const order = await Order.create({ user_id, total, showtime_id });

    const seatStatusPromises = seat_ids.map(async (item) => {
      return await SeatStatus.create({
        seat_id: item.id,
        showtime_id,
        user_id,
        status: "Blocked",
      });
    });

    const order_id = order.id;
    const requestId = order_id;

    // Tạo danh sách vé
    const ticketPromises = seat_ids.map(async (item) => {
      return await Ticket.create({
        order_id,
        seat_id: item.id,
        price: item.price,
      });
    });

    // Tạo danh sách combo
    const orderComboPromises = combos.map(async (item) => {
      return await OrderCombo.create({
        order_id,
        combo_id: item.id,
        quantity: item.quantity,
      });
    });

    await Promise.all([
      ...ticketPromises,
      ...orderComboPromises,
      ...seatStatusPromises,
    ]);

    if (promotion_id) {
      promotion_id = Number(promotion_id);
      await PromotionUsage.create({ user_id, promotion_id });
    }
    await transaction.commit();
    // Tạo extraData (mã hóa booking_id, user_id, showtime_id để sau này sử dụng)
    // const extraData = Buffer.from(JSON.stringify({
    //     order_id,
    //     user_id,
    //     showtime_id
    // })).toString('base64');

    const extraData = ""; // Nếu không cần gửi dữ liệu thêm, để trống

    const requestType = "payWithMethod";
    const autoCapture = true;
    const lang = "vi";
    const orderGroupId = "";

    // Tạo raw signature
    // const rawSignature =
    //     "accessKey=" + MOMO_CONFIG.ACCESS_KEY +
    //     "&amount=" + total +
    //     "&extraData=" + extraData +
    //     "&ipnUrl=" + MOMO_CONFIG.IPN_URL +
    //     "&orderId=" + requestId +
    //     "&orderInfo=" + orderInfo +
    //     "&partnerCode=" + MOMO_CONFIG.PARTNER_CODE +
    //     "&redirectUrl=" + MOMO_CONFIG.REDIRECT_URL +
    //     "&requestId=" + requestId +
    //     "&requestType=" + requestType;

    const signatureData = {
      accessKey: MOMO_CONFIG.ACCESS_KEY,
      amount: total,
      extraData: extraData,
      ipnUrl: MOMO_CONFIG.IPN_URL,
      orderId: requestId,
      orderInfo: orderInfo,
      partnerCode: MOMO_CONFIG.PARTNER_CODE,
      redirectUrl: MOMO_CONFIG.REDIRECT_URL,
      requestId: requestId,
      requestType: requestType,
    };

    const rawSignature = Object.keys(signatureData)
      .sort()
      .map((key) => `${key}=${signatureData[key]}`)
      .join("&");

    // Tạo signature
    // const signature = crypto
    //     .createHmac('sha256', MOMO_CONFIG.SECRET_KEY)
    //     .update(rawSignature)
    //     .digest('hex');

    const signature = crypto
      .createHmac("sha256", MOMO_CONFIG.SECRET_KEY)
      .update(rawSignature)
      .digest("hex");

    // Tạo request body
    const requestBody = JSON.stringify({
      partnerCode: MOMO_CONFIG.PARTNER_CODE,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId,
      amount: total,
      orderId: requestId,
      orderInfo: orderInfo,
      redirectUrl: MOMO_CONFIG.REDIRECT_URL,
      ipnUrl: MOMO_CONFIG.IPN_URL,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      orderGroupId: orderGroupId,
      signature: signature,
    });

    // Gửi request đến MOMO
    const response = await sendMoMoRequest(requestBody);

    // Lưu thông tin thanh toán vào database
    await Payment.create({
      orderId: order_id,
      amount: total,
      orderInfo,
      paymentType: "Momo",
      status: "Pending",
      user_id,
      showtime_id,
      extraData,
      responseData: JSON.stringify(response),
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("Lỗi khi tạo thanh toán MOMO:", error);
    await transaction.rollback();
    return {
      success: false,
      error: "Có lỗi xảy ra khi xử lý thanh toán",
      message: error.message,
    };
  }
};

// Service xử lý callback từ MOMO
const handleCallback = async (callbackData) => {
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
      signature,
    } = callbackData;

    console.log('Processing Momo callback for orderId:', orderId);

    // Tìm order dựa trên orderId
    const order = await Order.findOne({ where: { id: orderId } });

    if (!order) {
      console.error("Order not found for orderId:", orderId);
      return {
        status: 404,
        error: "Order not found",
        success: false,
        message: "Order not found but accepting callback",
      };
    }

    // Giải mã extraData nếu có
    let extraDataObj = {};
    if (extraData) {
      try {
        const decodedData = Buffer.from(extraData, "base64").toString();
        extraDataObj = JSON.parse(decodedData);
      } catch (error) {
        console.error("Lỗi khi giải mã extraData:", error);
      }
    }
    
    const user_id = order.user_id;
    const showtime_id = order.showtime_id;

    if (resultCode === '0' || resultCode === 0) {
      // Thanh toán thành công - Bắt đầu transaction
      const transaction = await sequelize.transaction();
      
      try {
        // Cập nhật trạng thái Order
        await order.update({
          status: "paid",
        }, { transaction });

        // Lấy thông tin người dùng và cập nhật điểm thưởng
        const userData = await User.findOne({ where: { id: user_id } });
        if (userData) {
          userData.star = userData.star + 3;
          await userData.save({ transaction });
        }

        // Lấy danh sách vé liên quan đến đơn hàng
        const tickets = await Ticket.findAll({
          where: { order_id: orderId },
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

        // Commit transaction trước khi gọi hàm bên ngoài
        await transaction.commit();

        // Tạo mã QR cho vé
        const email = userData?.email;
        const createQrCode = await generateQRCode({
          movieName: movieData.name,
          showtime: showtimeData.start_time,
          seatDatas,
          orderId,
          total: order.total,
          user_id,
          email,
        });

        console.log('Payment successful, QR code generated:', !!createQrCode);

        return {
          success: true,
          message: "Payment processed successfully",
          sendEmail: createQrCode,
        };
      } catch (error) {
        // Rollback nếu có lỗi
        await transaction.rollback();
        console.error("Lỗi khi xử lý thanh toán thành công:", error);
        return {
          success: false,
          message: "Error processing successful payment",
          error: error.message,
        };
      }
    } else {
      // Thanh toán thất bại
      await order.update({
        status: "failed",
        payment_status: "FAILED",
        error_message: message
      });

      // Giải phóng ghế đã đặt
      await releaseBookedSeats(orderId, showtime_id);

      console.log(`Payment failed for order ${orderId}, seats released`);

      return {
        success: true,
        message: "Payment failure processed",
      };
    }
  } catch (error) {
    console.error("Lỗi khi xử lý callback MOMO:", error);
    return {
      success: false,
      message: "Error occurred but processed",
      error: error.message
    };
  }
};

// Hàm tạo vé điện tử
const generateTickets = async (orderId) => {
  try {
    if (!orderId) {
      console.error("orderId not found:", orderId);
      return;
    }

    const ticketCode = generateTicketCode(orderId);

    return true;
  } catch (error) {
    console.error("Lỗi khi tạo vé:", error);
    return false;
  }
};

// Hàm giải phóng ghế khi thanh toán thất bại
const releaseBookedSeats = async (booking_id, showtime_id) => {
  try {
    // Lấy danh sách ghế từ booking
    const bookingSeats = await BookingSeat.findAll({
      where: { booking_id },
    });

    if (bookingSeats.length === 0) {
      return false;
    }

    // Lấy ID của các ghế cần giải phóng
    const seatIds = bookingSeats.map((bs) => bs.seat_id);

    // Cập nhật trạng thái ghế về AVAILABLE
    await Seat.update(
      { status: "AVAILABLE" },
      {
        where: {
          id: { [Op.in]: seatIds },
          showtime_id,
        },
      }
    );
    return true;
  } catch (error) {
    console.error("Lỗi khi giải phóng ghế:", error);
    return false;
  }
};

// Hàm tạo mã vé ngẫu nhiên
const generateTicketCode = (order_id) => {
  return (
    "TIX" +
    Date.now().toString().slice(-6) +
    Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0") +
    order_id
  );
};

// Hàm kiểm tra trạng thái thanh toán
const checkPaymentStatus = async (orderId) => {
  try {
    // Chỉ truy vấn thông tin đơn hàng, không cập nhật
    const orderData = await Order.findOne({ 
      where: { id: orderId },
      include: [
        {
          model: Showtime,
          include: [
            {
              model: Movie,
              attributes: ['id', 'name', 'poster']
            },
            {
              model: Room,
              include: [
                {
                  model: Cinema,
                  attributes: ['name']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!orderData) {
      return {
        status: 404,
        success: false,
        message: "Không tìm thấy đơn hàng.",
        error: "Order not found"
      };
    }
    
    // Lấy thông tin vé
    const tickets = await Ticket.findAll({
      where: { order_id: orderId }
    });
    
    // Lấy thông tin ghế
    const seats = await Promise.all(
      tickets.map(async (ticket) => {
        return await Seat.findOne({ where: { id: ticket.seat_id } });
      })
    );
    
    // Tính tổng số ghế
    const seat_count = seats.length;
    
    // Tạo thông tin để hiển thị cho người dùng
    const booking = {
      movie: orderData.Showtime?.Movie?.name || "N/A",
      showtime: orderData.Showtime?.start_time || "N/A",
      cinema: orderData.Showtime?.Room?.Cinema?.name || "N/A",
      seat_count,
      poster: orderData.Showtime?.Movie?.poster || null,
      room: orderData.Showtime?.Room?.name || "N/A",
      seats: seats.map(seat => seat ? `${seat.seat_row}${seat.seat_number}` : "").filter(Boolean).join(", "),
      status: orderData.status,
      total: orderData.total
    };

    return {
      status: 200,
      success: true,
      data: {
        payment_id: orderId,
        payment_status: orderData.status === "paid" ? "Success" : "Failed",
        message: orderData.status === "paid" ? "Thanh toán thành công" : "Thanh toán thất bại",
        booking
      },
      error: null
    };
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái đơn hàng:", error);
    return {
      success: false,
      message: "Lỗi khi kiểm tra trạng thái đơn hàng",
      error: error.message
    };
  }
};

module.exports = {
  payWithMoMo,
  handleCallback,
  checkPaymentStatus,
  generateTickets,
  releaseBookedSeats,
  getOrderByUserId,
  getAllOrders,
};
