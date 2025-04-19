const { User, sequelize } = require("../models");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();
const moment = require("moment-timezone");
const { error } = require("console");

const KEY_TOKEN_RESET_PASS = process.env.KEY_TOKEN_RESET_PASS;
const EMAIL_ADMIN = process.env.EMAIL_ADMIN;
const PASS_ADMIN = process.env.PASS_ADMIN;
const URL_CLIENT_BASE = process.env.URL_CLIENT_BASE;
const KEY_ACCESS_TOKEN = process.env.KEY_ACCESS_TOKEN;
const KEY_REFRESH_TOKEN = process.env.KEY_REFRESH_TOKEN;

// Lấy thời gian hiện tại theo GMT+7
const issuedAt = Math.floor(moment().tz("Asia/Ho_Chi_Minh").valueOf() / 1000);
const expiresInAccessToken = issuedAt + 24 * 60 * 60; // 1 ngày
const expiresInRefreshToken = issuedAt + 7 * 24 * 60 * 60; // 7 ngày

const Login = async ({ email, password }) => {
  try {
    email = _.trim(email);
    password = _.trim(password);

    const check = await User.findOne({ where: { email } });

    if (!check) {
      return { status: 401, success: false, error: true, message: "Email không tồn tại trong hệ thống!" };
    }

    if(check.dataValues.is_active === false) {
      return { 
        status: 403, 
        success: false, 
        error: true, 
        message: "Tài khoản chưa được kích hoạt! Vui lòng kích hoạt tài khoản"};
    }

    const checkPass = await bcrypt.compare(password, check.dataValues.password);

    if (checkPass) {
      const accessToken = jwt.sign(
        {
          id: check.dataValues.id,
          role: check.dataValues.role,
          username: check.dataValues.username,
          email: check.dataValues.email,
          image: check.dataValues.image,
        },
        KEY_ACCESS_TOKEN,
        { expiresIn: '1d' }
      );
      const refreshToken = jwt.sign(
        {
          id: check.dataValues.id,
        },
        KEY_REFRESH_TOKEN,
        { expiresIn: '7d' } // Hết hạn sau 7 ngày
      );

      return {
        status: 200,
        success: true, 
        error: false,
        data: {
          accessToken,
          refreshToken,
          id: check.dataValues.id,
          role: check.dataValues.role,
        },
        message: "Đăng nhập thành công!",
      };
    } else {
      return { status: 401, error: true, success: false, message: "Sai tài khoản hoặc mật khẩu!" };
    }
  } catch (error) {
    console.error("Error login user", error.message);
    return { status: 500, error: true, success: false, message: "Internal Server Error" };
  }
};

const Register = async ({ username, email, password, image }) => {
  try {
    username = _.trim(username);
    email = _.trim(email);

    const checkEmail = await User.findOne({ where: { email } });
    if (checkEmail) {
      return {
        status: 401,
        error: true,
        success: false,
        field: "email",
        message: "Email đã tồn tại trong hệ thống!",
      };
    }

    const salt = bcrypt.genSaltSync(10);
    password = bcrypt.hashSync(password, salt);

    const transaction = await sequelize.transaction();

    const user = await User.create({ username, email, password, image });

    await sendEmailActiveAccount({email});
    
    await transaction.commit(); 

    const message = "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.";
    return { status: 200, error: false, success: true, user, message };
  } catch (error) {
    await transaction.rollback(); 
    console.error("Error regiter user", error.message);
    return { status: 500, error: true, success: false, message: "Internal Server Error" };
  }
};

const checkEmail = async ({ email, image }) => {
  try {
    const check = await User.findOne({ where: { email } });
    if (check) {
      if (check.dataValues.image == null) {
        await User.update({ image }, { where: { id: check.id } });
      }
      if(check.dataValues.is_active === false) {
        await User.update({ is_active: true }, { where: { id: check.id } });
        }
      const accessToken = jwt.sign(
        {
          id: check.dataValues.id,
          role: check.dataValues.role,
          username: check.dataValues.username,
          email: check.dataValues.email,
          image: check.dataValues.image,
          iat: issuedAt,
          exp: expiresInAccessToken, // Hết hạn sau 7 ngày theo GMT+7
        },
        KEY_ACCESS_TOKEN
      );
      const refreshToken = jwt.sign(
        {
          id: check.dataValues.id,
          iat: issuedAt,
          exp: expiresInRefreshToken, // Hết hạn sau 7 ngày theo GMT+7
        },
        KEY_REFRESH_TOKEN
      );

      return {
        status: 200,
        data: {
          accessToken,
          refreshToken,
          id: check.dataValues.id,
          role: check.dataValues.role,
        },
      };
    } else {
      return { status: 401, message: "Email not found in the system" };
    }
  } catch (error) {
    console.error("Error reset password", error.message);
    return { status: 500, message: "Internal Server Error" };
  }
};

const forgotPassword = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return { success: false, error: true, status: 404, message: "Email không tồn tại trong hệ thống!" };
    }

    const resetToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        iat: issuedAt,
        exp: expiresInAccessToken, // Hết hạn sau 1 hour theo GMT+7
      },
      KEY_TOKEN_RESET_PASS
    );

    const emailResponse = await sendEmail({ email, token: resetToken });
    if (emailResponse.status === 500) {
      return { status: 500, message: "Gửi email thất bại!" };
    }

    return {
      success: true,
      error: false,
      status: 200,
      message: "Vui lòng kiểm tra email để đặt lại mật khẩu!",
    };
  } catch (error) {
    console.error("Lỗi quên mật khẩu:", error.message);
    return { status: 500, message: "Lỗi máy chủ nội bộ" };
  }
};

const sendEmail = async ({ email, token }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: EMAIL_ADMIN,
        pass: PASS_ADMIN,
      },
    });

    const resetLink = `${URL_CLIENT_BASE}/reset-password?token=${token}&email=${email}`;

    const mailOptions = {
      from: `"Bees Cinema" <${EMAIL_ADMIN}>`,
      to: email,
      subject: "Yêu cầu đặt lại mật khẩu",
      html: `
                <div style="max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
                    <div style="text-align: center;">
                        <h2 style="color: #ff9900;">🐝 Bees Cinema</h2>
                        <h3 style="color: #333;">Đặt lại mật khẩu</h3>
                    </div>
                    <p style="font-size: 16px; color: #555;">Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
                    <p style="font-size: 16px; color: #555;">Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${resetLink}" style="display: inline-block; background-color: #ff9900; color: #fff; padding: 12px 20px; text-decoration: none; font-weight: bold; border-radius: 5px;">
                            Đặt lại mật khẩu
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #888;">Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email này.</p>
                </div>
            `,
    };

    await transporter.sendMail(mailOptions);
    return { status: 200, message: "Email đã được gửi thành công!" };
  } catch (error) {
    console.error("Lỗi gửi email:", error.message);
    return { status: 500, message: "Lỗi máy chủ nội bộ!" };
  }
};

const newPassword = async ({ email, token, password }) => {
  try {
    const decoded = jwt.verify(token, KEY_TOKEN_RESET_PASS);
    const user = await User.findOne({ where: { email, id: decoded.id } });
    if (!user)
      return { status: 400, message: "Token không hợp lệ hoặc đã hết hạn!" };

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    user.password = hashedPassword;
    await user.save();

    return { status: 201, message: "Mật khẩu đã được cập nhật thành công!" };
  } catch (error) {
    console.error("Lỗi gửi email:", error.message);
    return { status: 500, message: error.message };
  }
};

const sendEmailActiveAccount = async ({ email}) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return { status: 404, error: true, success: false, message: "Người dùng không tồn tại!" };
    }

    const username = user.username || email; // Sử dụng email nếu không có tên người dùng

    const token = jwt.sign(
      {
        id: user.id,
      },
      KEY_ACCESS_TOKEN,
      { expiresIn: '1h' }
    );

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: EMAIL_ADMIN,
        pass: PASS_ADMIN,
      },
    });

    const activeLink = `${URL_CLIENT_BASE}/active-account?token=${token}&email=${email}`;

    const mailOptions = {
      from: `"Bees Cinema" <${EMAIL_ADMIN}>`,
      to: email,
      subject: "Xác thực tài khoản Bees Cinema",
      html: `
        <div style="max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
          <div style="text-align: center;">
            <h2 style="color: #ff9900;">🐝 Bees Cinema</h2>
            <h3 style="color: #333;">Chào mừng, ${username}!</h3>
          </div>
          <p style="font-size: 16px; color: #555;">Cảm ơn bạn đã đăng ký tài khoản tại <strong>Bees Cinema</strong>.</p>
          <p style="font-size: 16px; color: #555;">Vui lòng nhấp vào nút bên dưới để kích hoạt tài khoản của bạn.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${activeLink}" style="display: inline-block; background-color: #ff9900; color: #fff; padding: 12px 20px; text-decoration: none; font-weight: bold; border-radius: 5px;">
              Kích hoạt tài khoản
            </a>
          </div>
          <p style="font-size: 14px; color: #ff0000; font-weight: bold; text-align: center;">
            ⚠️ Liên kết xác thực có hiệu lực trong 1 giờ.
          </p>
          <p style="font-size: 14px; color: #888;">Nếu bạn không tạo tài khoản tại Bees Cinema, vui lòng bỏ qua email này.</p>
          <p style="font-size: 14px; color: #888; margin-top: 30px;">Trân trọng,<br/>Đội ngũ Bees Cinema</p>
        </div>
      `,
    };    
    await transporter.sendMail(mailOptions);
    return { status: 200, success: true, error: false, message: "Email xác thực đã được gửi thành công!" };
  } catch (error) {
    console.error("Lỗi gửi email:", error.message);
    return { status: 500, error: true, success: false, message: "Lỗi máy chủ khi gửi email xác thực!" };
  }
};

const activeAccountService = async ({ email, token }) => {
  try {
    const decoded = jwt.verify(token, KEY_ACCESS_TOKEN);
    const user = await User.findOne({ where: { email, id: decoded.id } });
    if (!user)
      return { status: 400, error: true, success: false, message: "Token không hợp lệ hoặc đã hết hạn!" };

    if (user.is_active) {
      return { status: 201, success: true, error: false, message: "Tài khoản đã được kích hoạt trước đó!!" };
    }

    user.is_active = true;
    await user.save();

    return { status: 201, success: true, error: false, message: "Tài khoản đã được kích hoạt!" };
  } catch (error) {
    console.error("Lỗi gửi email:", error.message);
    return { status: 500, error: true, success: false, message: error.message };
  }
};


module.exports = {
  Login,
  Register,
  forgotPassword,
  checkEmail,
  sendEmail,
  newPassword,
  activeAccountService,
  sendEmailActiveAccount
};
