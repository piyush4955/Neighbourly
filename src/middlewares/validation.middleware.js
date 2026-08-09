/**
 * Input validation middlewares for authentication and listing routes.
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

/**
 * Validates request payload for POST /api/listings
 */
export function validateCreateListing(req, res, next) {
  const { title, description, category } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: { message: 'Title is required and must be a non-empty string' } });
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({ error: { message: 'Description is required and must be a non-empty string' } });
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    return res.status(400).json({ error: { message: 'Category is required and must be a non-empty string' } });
  }

  next();
}

/**
 * Validates request payload for PATCH /api/listings/:id
 */
export function validateUpdateListing(req, res, next) {
  const { title, description, category } = req.body || {};

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({ error: { message: 'Title must be a non-empty string if provided' } });
  }

  if (description !== undefined && (typeof description !== 'string' || description.trim().length === 0)) {
    return res.status(400).json({ error: { message: 'Description must be a non-empty string if provided' } });
  }

  if (category !== undefined && (typeof category !== 'string' || category.trim().length === 0)) {
    return res.status(400).json({ error: { message: 'Category must be a non-empty string if provided' } });
  }

  next();
}
