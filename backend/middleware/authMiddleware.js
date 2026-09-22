import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Please login to continue.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Please login to continue.' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'You do not have permission to access this page.' });
  }
};

export const partnerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'partner') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Partner privileges required.' });
  }
};
