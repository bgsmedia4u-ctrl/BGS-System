import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) throw new Error('Invalid token');
    req.user = {
      id: decoded.sub,
      role: decoded.user_metadata?.role || 'admin',
      ...decoded
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
