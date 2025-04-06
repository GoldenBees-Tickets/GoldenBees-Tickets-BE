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
      return await SeatStatus.create({ seat_id: item.id, showtime_id, user_id, status: "Blocked" });
    });    

    const order_id = order.id;
    const requestId = order_id;

    // Tạo danh sách vé
    const ticketPromises = seat_ids.map(async (item) => {
      return await Ticket.create({ order_id, seat_id: item.id, price: item.price });
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
        ...seatStatusPromises
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

    // Cập nhật trạng thái thanh toán
    const payment = await Payment.findOne({ where: { orderId } });

    if (!payment) {
      console.error("Payment not found for orderId:", orderId);
      return {
        status: 404,
        error: "Payment not found",
        success: false,
        message: "Payment not found but accepting callback",
      };
    }

    // Giải mã extraData nếu có
    let bookingData = {};
    if (extraData) {
      try {
        const decodedData = Buffer.from(extraData, "base64").toString();
        bookingData = JSON.parse(decodedData);
      } catch (error) {
        console.error("Lỗi khi giải mã extraData:", error);
      }
    }

    const { booking_id, user_id, showtime_id } = bookingData;

    if (resultCode === 0) {
      // Thanh toán thành công
      await payment.update({
        status: "SUCCESS",
        transactionId: transId,
        paymentTime: responseTime,
        responseData: JSON.stringify(callbackData),
      });

      payment.save();

      await Order.update({
        status: "CONFIRMED",
        where: { id: orderId },
      });

      // Cập nhật trạng thái đặt vé
      if (booking_id) {
        try {
          // Cập nhật trạng thái booking
          // await Booking.update(
          //     {
          //         status: 'CONFIRMED',
          //         payment_status: 'PAID',
          //         payment_time: new Date(responseTime),
          //         payment_method: 'MOMO'
          //     },
          //     { where: { id: booking_id } }
          // );

          // Tạo vé điện tử
          await generateTickets(showtime_id);
        } catch (error) {
          console.error("Lỗi khi cập nhật booking:", error);
        }
      }
    } else {
      // Thanh toán thất bại
      await payment.update({
        status: "FAILED",
        responseData: JSON.stringify(callbackData),
        error_message: message,
      });

      payment.save();
    }

    return {
      success: true,
      message: "Processed",
    };
  } catch (error) {
    console.error("Lỗi khi xử lý callback MOMO:", error);
    return {
      success: false,
      message: "Error occurred but processed",
    };
  }
};

// Hàm tạo vé điện tử
const generateTickets = async (booking_id) => {
  try {
    if (!booking_id) {
      console.error("Booking not found:", booking_id);
      return;
    }

    const ticketCode = generateTicketCode(booking_id);

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
  const transaction = await sequelize.transaction();
  try {
    // Cập nhật trạng thái Payment
    const updatePayment = await Payment.update(
      { status: "Success" },
      { where: { orderId }, transaction }
    );

    // Cập nhật trạng thái Order
    const updateOrder = await Order.update(
      { status: "completed" },
      { where: { id: orderId }, transaction }
    );

    if (updatePayment[0] === 0 || updateOrder[0] === 0) {
      throw new Error("Cập nhật thất bại. Thực hiện rollback.");
    }

    // Commit transaction nếu mọi thứ thành công
    await transaction.commit();

    const orderData = await Order.findOne({ where: { id: orderId } });

    if (!orderData) throw new Error("Không tìm thấy đơn hàng.");
    const user_id = orderData.user_id;
    const userData = await User.findOne({ where: { id: user_id } });
    userData.star = userData.star + 3;
    await userData.save();

    const email = userData?.email;
    
    const SeatIds = await Ticket.findAll({
      where: { order_id: orderId },
    });

    const showtimeData = await Showtime.findOne({
      where: { id: orderData.showtime_id },
    });
    console.log("SeatIds", SeatIds);
    
    const updateShowtimeStatus = SeatIds?.map(async (item) => {
      return await SeatStatus.update(
        { status: "Booked" },
        {
          where: {
            seat_id: item.seat_id,
            showtime_id: orderData.showtime_id,
          },
        }
      )});
    

    if (!showtimeData) throw new Error("Không tìm thấy suất chiếu.");

    const movieData = await Movie.findOne({
      where: { id: showtimeData.movie_id },
    });

    if (!movieData) throw new Error("Không tìm thấy phim.");

    const ticketData = await Ticket.findAll({ where: { order_id: orderId } });

    if (!ticketData.length) throw new Error("Không tìm thấy vé.");

    // Lấy danh sách ghế
    const seatDatas = await Promise.all(
      ticketData.map(async (item) => {
        return await Seat.findOne({ where: { id: item.seat_id } });
      })
    );

    // Tạo mã QR
    const createQrCode = await generateQRCode({
      movieName: movieData.name,
      showtime: showtimeData.start_time,
      seatDatas,
      orderId,
      total: orderData.total,
      user_id,
      email,
    });

    return {
      status: 200,
      success: true,
      data: {
        payment_id: orderId,
        payment_status: "Success",
        message: "Thanh toán thành công",
      },
      sendEmail: createQrCode,
      error: null,
    };
  } catch (error) {
    console.error("Lỗi sau khi commit:", error);
    return {
      success: false,
      message: "Lỗi khi xử lý đơn hàng sau commit",
      error: error.message,
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
