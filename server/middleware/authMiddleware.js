const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

const protect = (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains { id, role }
    next();
  } catch (error) {
    console.error('Auth middleware token verification failed:', error.message);
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  protect(req, res, () => {
    const adminRoles = ['admin', 'super-admin', 'admin_course', 'admin_hiring', 'admin_exam'];
    if (req.user && adminRoles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
  });
};

module.exports = { protect, adminOnly };
