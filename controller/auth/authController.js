const { Login, Register, checkEmail, forgotPassword, newPassword, activeAccountService, sendEmailActiveAccount } = require("../../service/authService");
const { resErrors, resData } = require("../common/common");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const { getUser } = require("../../service/userService");
const KEY_REFRESH_TOKEN = process.env.KEY_REFRESH_TOKEN;
const KEY_ACCESS_TOKEN = process.env.KEY_ACCESS_TOKEN;
const API_KEY_LOGIN_GOOGLE = process.env.API_KEY_LOGIN_GOOGLE;
const client = new OAuth2Client(API_KEY_LOGIN_GOOGLE);

class ApiAuthController {
  static async login(req, res) {
    try {
      const {email, password} = req.body;      
      const data = await Login({email, password});
      res.json(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async verifyGoogleToken(req, res) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: 'Token là bắt buộc' });
      }
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: API_KEY_LOGIN_GOOGLE,  // Client ID của bạn
      });
      const payload = ticket.getPayload();      
      
      const userId = payload['sub'];
      const email = payload['email'];
      const image = payload["picture"];
      const checkMail = await checkEmail({email, image});
      if(checkMail.status === 200) {
        const data = checkMail
        return res.json(data);
      } else {
        const username = payload["name"];
        
        const password = 'defaultPassword123'; 
        const data = await Register({username, email, password, image});        
        const dataLogin = await Login({email, password});
        return res.json(dataLogin);
      }
    } catch (error) {
      console.error("Error verify Google Token:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async create(req, res) {
    try {
      let { username, email, password } = req.body;
      const image = null;
      let data = await Register({username, email, password, image});
      res.json(data);
    } catch (error) {
      console.error("Error creating user:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async resetPass(req, res) {
    try {
      const {email} = req.body;
      const newPass = await forgotPassword(email);      
      res.json(newPass);
    } catch (error) {
      console.error("Error reset password:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async newPassword(req, res) {
    try {
      const {token, password, email} = req.body;
      const new_pass = newPassword({token, password, email});
      res.json(new_pass);             
    } catch (error) {
      console.error("Error reset password:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({ message: "Không có refresh token" });
      }
  
      jwt.verify(refreshToken, KEY_REFRESH_TOKEN, async (err, user) => {
        if (err) {
          return res.status(403).json({ message: "Refresh token không hợp lệ" });
        }
        let id = user.id;
        const newUser = await getUser(id)
        
        const accessToken = jwt.sign(
          {
            id: newUser.dataValues.id,
            role: newUser.dataValues.role,
            username: newUser.dataValues.username,
            email: newUser.dataValues.email,
          },
          KEY_ACCESS_TOKEN,
          { expiresIn: "1h" }
        );
  
        return res.json({ accessToken });
      });
    } catch (error) {
      console.error("Error refreshing token:", error);
      res.status(500).json({ message: error.message || "Lỗi máy chủ nội bộ" });
    }
  }

  static async activeAccount(req, res) {
    try {
      const { email, token } = req.body;
      const data = await activeAccountService({ email, token });
      res.json(data);
    } catch (error) {
      console.error("Error active account:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }

  static async resendActive(req, res) {
    try {
      const { email } = req.body;
      const data = await sendEmailActiveAccount({ email });
      res.json(data);
    } catch (error) {
      console.error("Error resend active account:", error);
      resErrors(res, 500, error.message || "Lỗi máy chủ nội bộ");
    }
  }
}
module.exports = ApiAuthController;
