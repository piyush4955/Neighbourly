/**
 * Location Service for Neighborly.
 *
 * Enforces AGENTS.md Rule 1:
 * Exact user coordinates must NEVER be sent to the client in any API response.
 * All location data returned to clients must go through this single blurring function.
 *
 * Choice: Coordinate Rounding to 2 decimal places.
 * Rationale: Rounding latitude and longitude to 2 decimal places provides an approximate accuracy
 * of ~1.1 kilometers (neighborhood-level precision), protecting user privacy while preserving local proximity relevance.
 */

/**
 * Blurs exact latitude and longitude coordinates by rounding to 2 decimal places (~1.1km precision).
 * @param {number|string} lat - Latitude
 * @param {number|string} lng - Longitude
 * @returns {{ latitude: number, longitude: number } | null} Blurred location coordinates
 */
export function blurLocation(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return null;
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return null;
  }

  return {
    latitude: Math.round(parsedLat * 100) / 100,
    longitude: Math.round(parsedLng * 100) / 100
  };
}

/**
 * Formats distance in miles into a human-readable string.
 * @param {number|null} distanceMiles
 * @returns {string|null} e.g. "0.4 mi away", "Under 0.1 mi away", or null
 */
export function formatDistance(distanceMiles) {
  if (distanceMiles === null || distanceMiles === undefined || isNaN(distanceMiles)) {
    return null;
  }

  const dist = parseFloat(distanceMiles);
  if (dist < 0.1) {
    return 'Under 0.1 mi away';
  }

  return `${dist.toFixed(1)} mi away`;
}

/**
 * Formats latitude and longitude into a PostGIS geography WKT Point string (SRID 4326).
 * Always applies location blurring prior to PostGIS conversion.
 * @param {number|string} lat - Latitude
 * @param {number|string} lng - Longitude
 * @returns {string|null} PostGIS EWKT point string e.g. "SRID=4326;POINT(lng lat)"
 */
export function formatPostGISPoint(lat, lng) {
  const blurred = blurLocation(lat, lng);
  if (!blurred) return null;

  return `SRID=4326;POINT(${blurred.longitude} ${blurred.latitude})`;
}
