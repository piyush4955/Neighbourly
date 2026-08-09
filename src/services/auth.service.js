import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { config } from '../config/env.js';
import { formatPostGISPoint, blurLocation } from './location.service.js';
import { sanitizeUser } from '../utils/response.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '7d';

/**
 * Generates a signed JWT token for a given user ID.
 * @param {string} userId
 * @returns {string} JWT Token
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: TOKEN_EXPIRES_IN });
}

/**
 * Registers a new user with hashed password and blurred location.
 */
export async function signupUser({ name, email, password, bio, latitude, longitude }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email is already registered
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  // Hash password with bcrypt
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Format PostGIS geography point (applies location blurring)
  const blurredLoc = blurLocation(latitude, longitude);

  let newUser;

  if (blurredLoc) {
    // Insert user with PostGIS geography point via raw query
    const result = await prisma.$queryRaw`
      INSERT INTO "users" (id, email, password, name, bio, approx_location, created_at, avg_rating)
      VALUES (
        gen_random_uuid()::text,
        ${normalizedEmail},
        ${hashedPassword},
        ${name.trim()},
        ${bio ? bio.trim() : null},
        ST_SetSRID(ST_MakePoint(${blurredLoc.longitude}, ${blurredLoc.latitude}), 4326)::geography,
        NOW(),
        0.0
      )
      RETURNING id, email, name, bio, created_at, avg_rating;
    `;

    newUser = result[0];
    newUser.approxLocation = blurredLoc;
  } else {
    // Insert user without location
    newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        bio: bio ? bio.trim() : null
      }
    });
  }

  const token = generateToken(newUser.id);

  return {
    user: sanitizeUser(newUser),
    token
  };
}

/**
 * Authenticates user credentials and returns a JWT token.
 */
export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user.id);

  return {
    user: sanitizeUser(user),
    token
  };
}

/**
 * Verifies JWT token and retrieves target user record.
 */
export async function verifyTokenAndGetUser(token) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return null;
    }

    return sanitizeUser(user);
  } catch {
    return null;
  }
}
