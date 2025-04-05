const jwt = require('jsonwebtoken');
const KEY_ACCESS_TOKEN = process.env.KEY_ACCESS_TOKEN;

const Authorization = (req, res, next) => {

  const token = req.headers['authorization']?.split(' ')[1];  
  if (!token) {
    return res.status(401).json({ message: 'Access token is missing' });
  }

  jwt.verify(token, KEY_ACCESS_TOKEN, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user; 
    next();  
  });
};

module.exports = Authorization;
