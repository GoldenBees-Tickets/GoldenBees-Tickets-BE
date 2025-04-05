const jwt = require('jsonwebtoken');
const KEY_ACCESS_TOKEN = process.env.KEY_ACCESS_TOKEN;

const AuthorizationAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {    
    return res.status(401).json({ message: 'Access token is missing' });
  }

  jwt.verify(token, KEY_ACCESS_TOKEN, (err, user) => {
    if (err) {      
      return res.status(403).json({ message: 'Invalid token' });
    }    
    if(user.role === 'admin') {
        req.user = user; 
        next(); 
    } else {
        res.status(403).json({ message: 'You do not have access!' });
    }
  });
};

module.exports = AuthorizationAdmin;