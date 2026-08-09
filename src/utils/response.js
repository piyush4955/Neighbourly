import { blurLocation } from '../services/location.service.js';

/**
 * Sanitizes user database object for client API responses:
 * 1. Excludes password hash.
 * 2. Applies location blurring via location.service.js (AGENTS.md Rule 1).
 *
 * @param {Object} user - User entity from DB
 * @returns {Object} Clean user payload safe for client response
 */
export function sanitizeUser(user) {
  if (!user) return null;

  const { password, approxLocation, ...sanitized } = user;

  let location = null;
  if (approxLocation) {
    if (typeof approxLocation === 'object' && Array.isArray(approxLocation.coordinates)) {
      location = blurLocation(approxLocation.coordinates[1], approxLocation.coordinates[0]);
    } else if (typeof approxLocation === 'string') {
      const match = approxLocation.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (match) {
        location = blurLocation(match[2], match[1]);
      }
    } else if (user.latitude !== undefined && user.longitude !== undefined) {
      location = blurLocation(user.latitude, user.longitude);
    }
  }

  return {
    ...sanitized,
    approxLocation: location
  };
}
