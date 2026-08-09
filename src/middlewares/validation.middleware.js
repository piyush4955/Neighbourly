/**
 * Input validation middlewares for authentication routes.
 * Enforces AGENTS.md Rule 4 (input validation & basic error handling).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Validates request payload for POST /api/auth/signup
 */
export function validateSignup(req, res, next) {
  const { name, email, password } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: { message: 'Name is required and must be a non-empty string' } });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: { message: 'A valid email address is required' } });
  }

  if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      error: { message: `Password is required and must be at least ${MIN_PASSWORD_LENGTH} characters long` }
    });
  }

  next();
}

/**
 * Validates request payload for POST /api/auth/login
 */
export function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: { message: 'A valid email address is required' } });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: { message: 'Password is required' } });
  }

  next();
}
