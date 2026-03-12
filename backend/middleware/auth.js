const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role isBanned username');
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    if (user.isBanned) return res.status(403).json({ message: 'Account banned' });

    req.user = {
      id: decoded.id,
      role: user.role,
      username: user.username || decoded.username
    };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};
