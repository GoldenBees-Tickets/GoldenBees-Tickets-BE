const qrService = require("../../service/qrService");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const db = require("../../models");

const generateQR = async (req, res) => {
  try {
    const { data, email } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu để tạo mã QR là bắt buộc",
      });
    }

    // Thêm email vào dữ liệu nếu có
    let qrData;
    if (email) {
      qrData = await qrService.generateQRCode({ ...data, email });
    } else {
      qrData = await qrService.generateQRCode(data);
    }

    // Tạo phản hồi với thông tin về việc gửi email
    const response = {
      success: true,
      message: "Tạo mã QR thành công",
      data: {
        qrUrl: qrData.qrUrl,
        ticketId: qrData.ticketId,
      },
    };

    // Thêm thông tin về việc gửi email nếu có email
    if (email) {
      if (qrData.emailResult && qrData.emailResult.success) {
        response.emailSent = true;
        response.emailMessage = "Đã gửi mã QR đến email của bạn";
        response.emailDetails = qrData.emailResult;
      } else {
        response.emailSent = false;
        response.emailMessage = qrData.emailResult
          ? qrData.emailResult.message
          : "Gửi email không thành công";
        console.error("Lỗi gửi email:", qrData.emailResult);
      }
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Lỗi khi tạo mã QR:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo mã QR: " + error.message,
      errorDetails: error.toString(),
    });
  }
};

const scanQR = async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "Mã đơn hàng là bắt buộc",
      });
    }

    // Gọi service để quét mã QR
    const scanResult = await qrService.scanQRCode(order_id);

   res.json(scanResult);
  } catch (error) {
    console.error("Lỗi khi quét mã QR:", error);

    // Xử lý lỗi không tìm thấy đơn hàng
    if (error.message === "Không tìm thấy đơn hàng") {
      return res.status(404).json({
        success: false,
        message: error.message,
        orderId: req.body.order_id,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi khi quét mã QR: " + error.message,
      error: error.stack,
    });
  }
};

// Hàm gửi lại mã QR qua email
const resendQREmail = async (req, res) => {
  try {
    const { ticketId, email } = req.body;

    if (!ticketId || !email) {
      return res.status(400).json({
        success: false,
        message: "Mã vé và email là bắt buộc",
      });
    }

    // Tìm thông tin vé từ database
    const ticket = await db.Ticket1.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vé",
      });
    }

    // Tạo lại mã QR cho vé đã tồn tại
    const fileName = `qr_resend_${Date.now()}.png`;
    const filePath = path.join(__dirname, "../../public/qr-codes", fileName);

    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(path.join(__dirname, "../../public/qr-codes"))) {
      fs.mkdirSync(path.join(__dirname, "../../public/qr-codes"), {
        recursive: true,
      });
    }

    // Tạo mã QR
    await QRCode.toFile(filePath, ticketId.toString(), {
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      width: 400,
      margin: 2,
    });

    const qrUrl = `/qr-codes/${fileName}`;

    // Chuẩn bị dữ liệu vé để gửi email
    const ticketData = {
      movieName: ticket.movieName,
      showTime: ticket.showTime,
      seat: ticket.seat,
      price: ticket.price,
    };

    // Gửi email với mã QR
    const emailResult = await qrService.sendQRCodeEmail({
      email,
      qrUrl,
      ticketId,
      ticketData,
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: emailResult.message,
        errorDetails: emailResult.error,
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã gửi lại mã QR qua email",
      data: {
        qrUrl,
        ticketId,
      },
      emailDetails: emailResult,
    });
  } catch (error) {
    console.error("Lỗi khi gửi lại mã QR qua email:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi gửi lại mã QR: " + error.message,
      error: error.stack,
    });
  }
};

module.exports = {
  generateQR,
  scanQR,
  resendQREmail,
};
