const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const db = require("../models");
const Ticket1 = db.Ticket1;
const nodemailer = require("nodemailer");
require("dotenv").config();
const {Order} = require("../models");
const { where } = require("sequelize");
const { error } = require("console");
const { data } = require("autoprefixer");
const { OrderDetail, Seat, Showtime, Movie, User } = require("../models");

// Lấy thông tin email từ biến môi trường
const EMAIL_ADMIN = process.env.EMAIL_ADMIN;
const PASS_ADMIN = process.env.PASS_ADMIN;
const URL_CLIENT_BASE = process.env.URL_CLIENT_BASE || "http://localhost:5173";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const NODEMAILER_DEBUG = process.env.NODEMAILER_DEBUG === 'true';

// Hàm gửi email với mã QR
const sendQRCodeEmail = async ({
  movieName,
  email,
  qrUrl,
  orderId,
  showtime,
  seatDatas,
  total,
}) => {
  
  try {
    // Format lại showtime để hiển thị đúng
    let formattedShowtime = showtime;
    
    // Kiểm tra xem showtime có định dạng "HH:MM:SS YYYY-MM-DD" không
    if (typeof showtime === 'string' && showtime.includes(':') && showtime.includes('-')) {
      // Tách thời gian và ngày
      const parts = showtime.split(' ');
      if (parts.length === 2) {
        const timePart = parts[0]; // "20:00:00"
        const datePart = parts[1]; // "2025-04-12"
        
        // Tạo chuỗi định dạng hợp lệ cho Date: "YYYY-MM-DDThh:mm:ss"
        const isoDateString = `${datePart}T${timePart}`;
        
        try {
          // Tạo đối tượng Date và định dạng lại theo múi giờ Việt Nam
          const date = new Date(isoDateString);
          if (!isNaN(date.getTime())) {
            formattedShowtime = date.toLocaleString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
          } else {
            // Fallback: Hiển thị dưới dạng text đẹp hơn
            formattedShowtime = `${timePart.substring(0, 5)} ngày ${datePart.split('-').reverse().join('/')}`;
          }
        } catch (dateError) {
          console.error('Lỗi khi định dạng ngày:', dateError);
          // Fallback: Hiển thị dưới dạng text nếu lỗi
          formattedShowtime = `${timePart.substring(0, 5)} ngày ${datePart.split('-').reverse().join('/')}`;
        }
      }
    }

    // Tạo mã QR dạng Base64 để nhúng trực tiếp vào email
    const qrCodeDataUri = await QRCode.toDataURL(orderId.toString(), {
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      width: 300,
      margin: 2,
    });

    const seatNumbers =
      seatDatas && seatDatas.length > 0
        ? seatDatas.map((item) => item.seat_row + item.seat_number).join(", ")
        : "Chưa có ghế";


    const transportConfig = {
      service: "Gmail",
      auth: { user: EMAIL_ADMIN, pass: PASS_ADMIN },
      tls: { rejectUnauthorized: false },
      secureConnection: false,
    };
    
    // Thêm cài đặt debug nếu được bật
    if (NODEMAILER_DEBUG) {
      transportConfig.debug = true;
      transportConfig.logger = true;
    }
    
    const transporter = nodemailer.createTransport(transportConfig);

    // Xử lý đường dẫn QR code
    const qrFilePath = path.join(
      __dirname,
      "../public",
      qrUrl.replace("/qr-codes/", "")
    );

    
    // Tạo nội dung HTML email với thông tin vé và mã QR
    const mailOptions = {
      from: {
        name: "Bees Cinema",
        address: EMAIL_ADMIN,
      },
      to: email,
      subject: "Vé xem phim của bạn - Bees Cinema",
      html: `
                <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #333; border-radius: 10px; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #121212; color: #e0e0e0;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h2 style="color: #ffd700; margin: 0; padding: 0; font-size: 28px;">🐝 BEES CINEMA</h2>
                        <div style="width: 80px; height: 3px; background: linear-gradient(90deg, transparent, #ffd700, transparent); margin: 15px auto;"></div>
                        <h3 style="color: #ffffff; font-weight: 300; margin: 0;">VÉ XEM PHIM CỦA BẠN</h3>
                    </div>
                    
                    <div style="background-color: #1e1e1e; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #333; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                        <h4 style="color: #ffd700; margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 10px; font-size: 18px;">THÔNG TIN VÉ</h4>
                        <table style="width: 100%; border-collapse: collapse; color: #e0e0e0;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; width: 40%;">Phim:</td>
                                <td style="padding: 8px 0;">${movieName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; border-top: 1px dotted #333;">Suất chiếu:</td>
                                <td style="padding: 8px 0; border-top: 1px dotted #333;">${formattedShowtime}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; border-top: 1px dotted #333;">Ghế:</td>
                                <td style="padding: 8px 0; border-top: 1px dotted #333;">${seatNumbers}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; border-top: 1px dotted #333;">Mã vé:</td>
                                <td style="padding: 8px 0; border-top: 1px dotted #333;">${orderId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; border-top: 1px dotted #333;">Giá:</td>
                                <td style="padding: 8px 0; border-top: 1px dotted #333;">${Number(total).toLocaleString("vi-VN")} VND</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 25px; background-color: #1e1e1e; padding: 20px; border-radius: 8px; border: 1px solid #333; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                        <p style="font-weight: bold; color: #ffd700; margin-bottom: 15px; font-size: 18px;">MÃ QR CỦA BẠN</p>
                        <div style="background-color: white; width: 210px; height: 210px; padding: 5px; margin: 0 auto; border-radius: 5px;">
                            <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; margin: 0 auto; display: block;">
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 25px;">
                        <a href="${SERVER_URL}/public${qrUrl}" 
                           download="QR_Ticket_${orderId}.png"
                           style="background-color: #ffd700; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: all 0.3s;">
                           Tải mã QR
                        </a>
                    </div>
                    
                    <div style="text-align: center; border-top: 1px solid #333; padding-top: 20px; margin-top: 20px;">
                        <p style="font-size: 14px; color: #b0b0b0; margin: 5px 0;">Vui lòng xuất trình mã QR này khi đến rạp để nhận vé.</p>
                        <p style="font-size: 14px; color: #b0b0b0; margin: 5px 0;">Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
                        <p style="font-size: 14px; color: #b0b0b0; margin: 5px 0;">Chúc bạn có trải nghiệm xem phim tuyệt vời!</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent, #333, transparent); margin: 15px auto;"></div>
                        <p style="font-size: 12px; color: #666; margin-top: 15px;">© 2024 Bees Cinema. All rights reserved.</p>
                        <div style="margin-top: 15px;">
                            <a href="#" style="display: inline-block; margin: 0 10px; color: #ffd700; text-decoration: none;">Website</a>
                            <a href="#" style="display: inline-block; margin: 0 10px; color: #ffd700; text-decoration: none;">Facebook</a>
                            <a href="#" style="display: inline-block; margin: 0 10px; color: #ffd700; text-decoration: none;">Instagram</a>
                        </div>
                    </div>
                </div>
            `,
      attachments: [
        {
          filename: "QR_Ticket_" + orderId + ".png",
          path: path.join(__dirname, "../public", qrUrl),
          cid: "qrcode",
          contentType: "image/png",
        },
      ],
      // Thêm headers để giảm khả năng bị đánh dấu là spam
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "High",
      },
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Ghi log vào file
    const logMessage = `${new Date().toISOString()} - Email sent successfully to ${email} for order ${orderId} - MessageID: ${info.messageId}\n`;
    try {
      const logDir = path.join(__dirname, "../logs");
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(path.join(logDir, "nodemailer.log"), logMessage);
    } catch (logError) {
      console.error("Không thể ghi log email:", logError);
    }

    return {
      success: true,
      message: "Email đã được gửi thành công!",
      emailId: info.messageId,
    };
  } catch (error) {
    console.error("Lỗi gửi email mã QR:", error.message);
    console.error("Chi tiết lỗi:", error);
    
    // In thêm thông tin để debug
    console.error(`Thông tin gửi email bị lỗi:
      - Email: ${email || 'không có'}
      - OrderId: ${orderId || 'không có'}
      - MovieName: ${movieName || 'không có'}
      - ShowTime: ${showtime || 'không có'}
      - QR URL: ${qrUrl || 'không có'}
      - SeatDatas: ${seatDatas ? JSON.stringify(seatDatas) : 'không có'}
    `);
    
    // Ghi log lỗi vào file
    const errorLogMessage = `${new Date().toISOString()} - ERROR sending email to ${email} for order ${orderId} - ${error.message}\n${error.stack || 'No stack trace'}\n---\n`;
    try {
      const logDir = path.join(__dirname, "../logs");
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(path.join(logDir, "nodemailer-errors.log"), errorLogMessage);
    } catch (logError) {
      console.error("Không thể ghi log lỗi email:", logError);
    }
    
    return {
      success: false,
      message: "Lỗi gửi email: " + error.message,
      error,
    };
  }
};

// Tạo và lưu mã QR cho vé
const generateQRCode = async (data) => {
  try {    
    // Trích xuất dữ liệu
    const {
      movieName,
      showtime,
      seatDatas,
      orderId,
      total,
      user_id,
      email
    } = data;
    
    if (!orderId) {
      throw new Error("Thiếu orderId, không thể tạo mã QR.");
    }
    
    // Chuẩn bị dữ liệu ghế
    let formattedSeatDatas = seatDatas;
    
    // Kiểm tra và chuyển đổi dữ liệu ghế từ Sequelize model nếu cần
    if (seatDatas && Array.isArray(seatDatas)) {
      formattedSeatDatas = seatDatas.map(seat => {
        // Nếu là Sequelize model (có dataValues)
        if (seat && seat.dataValues) {
          return {
            id: seat.dataValues.id,
            seat_row: seat.dataValues.seat_row,
            seat_number: seat.dataValues.seat_number,
            price: seat.dataValues.price
          };
        }
        // Nếu là object JavaScript thông thường
        return seat;
      });
    }
        
    // Tạo tên file duy nhất
    const fileName = `qr_${Date.now()}.png`;
    const filePath = path.join(__dirname, "../public/qr-codes", fileName);

    // Đảm bảo thư mục tồn tại
    await fs.promises.mkdir(path.join(__dirname, "../public/qr-codes"), {
      recursive: true,
    });

    // Tạo mã QR
    await QRCode.toFile(filePath, orderId.toString(), {
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      width: 400,
      margin: 2,
    });

    // Trả về URL của mã QR
    const qrUrl = `/qr-codes/${fileName}`;
    const qr_code = `/public${qrUrl}`;
    
    // LƯU Ý: Không cập nhật qr_code vào bảng Order ở đây
    // Thay vào đó sẽ trả về qrUrl và qr_code để service gọi hàm này tự cập nhật
    
    // Nếu có email trong dữ liệu, gửi mã QR qua email
    let emailResult = null;
    if (email) {
      try {
        emailResult = await sendQRCodeEmail({
          movieName,
          email,
          qrUrl,
          showtime,
          seatDatas: formattedSeatDatas, // Sử dụng dữ liệu ghế đã định dạng
          orderId,
          total,
        });
      } catch (emailError) {
        console.error("Lỗi khi gửi email:", emailError);
        emailResult = {
          success: false,
          message: "Lỗi gửi email: " + emailError.message
        };
      }
    }

    return {
      success: true,
      message: 'QR code generated successfully',
      qrUrl,
      qr_code,
      emailResult,
    };
  } catch (error) {
    console.error("Lỗi khi tạo mã QR:", error);
    return {
      success: false,
      error: error.message || "Lỗi không xác định khi tạo mã QR"
    };
  }
};

// Quét và xử lý mã QR
const scanQRCode = async (order_id) => {
  try {
    
    if (!order_id) {
      throw new Error("Mã đơn hàng là bắt buộc");
    }

    // Import models từ file models
    const { Order, Ticket, Seat, Showtime, Movie, Room, Cinema } = require("../models");

    // Tìm đơn hàng trong database
    // let order = await Order.findOne({
    //   where: { id: order_id }
    // });
    const order = await Order.findOne({
      include: [
        {
          model: Ticket,
          attributes: ["id"], // bạn có thể lấy thêm thông tin nếu cần
          include: [
            {
              model: Seat,
              attributes: ["seat_row", "seat_number"],
            },
          ],
        },
        {
          model: Showtime,
          attributes: ["id", "start_time", "show_date"],
          include: [
            {
              model: Movie,
              attributes: ["name", "poster", "age_rating", "duration"],
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
      where: { id: order_id },
      order: [["order_date", "DESC"]],
    });

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.status === "paid") {
      
      // Cập nhật trạng thái đơn hàng
      order.status = "completed";
      await order.save();

      return {
        status: 200,
        success: true,
        error: false,
        message: "Quét vé thành công",
        data: order
      };
    } else {
      return {
        status: 400,
        success: false,
        error: true,
        message: `Đơn hàng đã được xử lý trước đó (${order.status})`,
        data: {
          order: {
            id: order.id,
            status: order.status,
            updatedAt: order.updatedAt
          }
        }
      };
    }
  } catch (error) {
    console.error("Lỗi khi quét mã QR:", error);
    throw error;
  }
};

module.exports = {
  generateQRCode,
  scanQRCode,
  sendQRCodeEmail,
};
