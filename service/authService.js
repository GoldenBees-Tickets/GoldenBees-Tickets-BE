const { User } = require("../models");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();
const KEY_TOKEN_RESET_PASS = process.env.KEY_TOKEN_RESET_PASS;
const EMAIL_ADMIN = process.env.EMAIL_ADMIN;
const PASS_ADMIN = process.env.PASS_ADMIN;
const URL_CLIENT_BASE = process.env.URL_CLIENT_BASE;
const KEY_ACCESS_TOKEN = process.env.KEY_ACCESS_TOKEN;
const KEY_REFRESH_TOKEN = process.env.KEY_REFRESH_TOKEN;

const Login = async ({ email, password }) => {
  try {
    email = _.trim(email);
    password = _.trim(password);

    const check = await User.findOne({ where: { email } });

    if (!check) {
      return { status: 401, message: "Sai tài khoản hoặc mật khẩu!" };
    }

    const checkPass = bcrypt.compareSync(password, check.dataValues.password);

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
        { expiresIn: "1d" }
      );
      const refreshToken = jwt.sign(
        {
          id: check.dataValues.id,
        },
        KEY_REFRESH_TOKEN,
        { expiresIn: "7d" }
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
      return { status: 401, message: "Sai tài khoản hoặc mật khẩu!" };
    }
  } catch (error) {
    console.error("Error login user", error.message);
    return { status: 500, message: "Internal Server Error" };
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
        field: "email",
        message: "Email already exists!!!",
      };
    }

    const salt = bcrypt.genSaltSync(10);
    password = bcrypt.hashSync(password, salt);

    const user = await User.create({ username, email, password, image });

    const message = "Create user is successfully";
    return { status: 200, user, message };
  } catch (error) {
    console.error("Error regiter user", error.message);
    return { status: 500, message: "Internal Server Error" };
  }
};

const checkEmail = async ({ email, image }) => {
  try {
    const check = await User.findOne({ where: { email } });
    if (check) {
      if (check.dataValues.image == null) {
        await User.update({ image }, { where: { id: check.id } });
      }
      const accessToken = jwt.sign(
        {
          id: check.dataValues.id,
          role: check.dataValues.role,
          username: check.dataValues.username,
          email: check.dataValues.email,
          image: check.dataValues.image,
        },
        KEY_ACCESS_TOKEN,
        { expiresIn: "1h" }
      );
      const refreshToken = jwt.sign(
        {
          id: check.dataValues.id,
        },
        KEY_REFRESH_TOKEN,
        { expiresIn: "3d" }
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
      return { status: 401, message: "Email không tồn tại trong hệ thống!" };
    }

    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      KEY_TOKEN_RESET_PASS,
      { expiresIn: "1h" }
    );

    const emailResponse = await sendEmail({ email, token: resetToken });
    if (emailResponse.status === 500) {
      return { status: 500, message: "Gửi email thất bại!" };
    }

    return {
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
    const user = await User.findOne({where: { email, id: decoded.id }});
    if (!user)
      return ({ status: 400, message: "Token không hợp lệ hoặc đã hết hạn!" });
    
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    user.password = hashedPassword;
    await user.save();

    return ({status: 201, message: "Mật khẩu đã được cập nhật thành công!"});
  } catch (error) {
    console.error("Lỗi gửi email:", error.message);
    return { status: 500, message: error.message };
  }
};

module.exports = {
  Login,
  Register,
  forgotPassword,
  checkEmail,
  sendEmail,
  newPassword,
};
