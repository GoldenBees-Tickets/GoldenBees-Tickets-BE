const jwt = require('jsonwebtoken');
const KEY_ACCESS_TOKEN = process.env.KEY_ACCESS_TOKEN;

const Authorization = (req, res, next) => {

  const token = req.headers['authorization']?.split(' ')[1];  
  if (!token) {
    return res.status(401).json({ message: 'Thiếu token xác thực' });
  }

  jwt.verify(token, KEY_ACCESS_TOKEN, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token đã hết hạn. Vui lòng đăng nhập lại.' });
      }
      return res.status(403).json({ message: 'Token không hợp lệ' });
    }
    req.user = user; 
    next();  
  });
};

module.exports = Authorization;
