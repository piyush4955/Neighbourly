import { verifyTokenAndGetUser } from '../services/auth.service.js';

/**
 * Authentication Middleware:
 * Verifies JWT token from Authorization header (Bearer token)
 * and attaches sanitized user object to req.user.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { message: 'Authentication token required (format: Authorization: Bearer <token>)' }
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: { message: 'Authentication token missing' } });
    }

    const user = await verifyTokenAndGetUser(token);
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid or expired token' } });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
