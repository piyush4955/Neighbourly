import { signupUser, loginUser } from '../services/auth.service.js';

/**
 * Controller for user registration (POST /api/auth/signup).
 * Thin controller: parses request parameters and delegates to authService.
 */
export async function signup(req, res, next) {
  try {
    const { name, email, password, bio, latitude, longitude, approx_location } = req.body;

    const lat = latitude ?? approx_location?.lat ?? approx_location?.latitude;
    const lng = longitude ?? approx_location?.lng ?? approx_location?.longitude;

    const result = await signupUser({
      name,
      email,
      password,
      bio,
      latitude: lat,
      longitude: lng
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for user login (POST /api/auth/login).
 * Thin controller: parses request body and delegates to authService.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await loginUser({ email, password });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
