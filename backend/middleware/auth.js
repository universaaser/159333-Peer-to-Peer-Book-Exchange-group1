const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    User.updateOne({ _id: decoded.id }, { lastActiveAt: new Date() }).catch(() => {});
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};