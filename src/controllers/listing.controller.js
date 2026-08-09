import * as listingService from '../services/listing.service.js';

/**
 * Controller for creating a listing (POST /api/listings).
 */
export async function createListing(req, res, next) {
  try {
    const { title, description, category } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const listing = await listingService.createListing({
      ownerId: req.user.id,
      title,
      description,
      category,
      photoUrl
    });

    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for listing active TOOL listings (GET /api/listings).
 * Supports PostGIS spatial distance filtering (lat, lng, radius), category, keyword, and pagination (page, limit).
 * Public endpoint.
 */
export async function getListings(req, res, next) {
  try {
    const { lat, lng, radius, category, keyword, page, limit } = req.query;

    // Validate partial location input
    const hasLat = lat !== undefined && lat !== null && lat !== '';
    const hasLng = lng !== undefined && lng !== null && lng !== '';

    if ((hasLat && !hasLng) || (!hasLat && hasLng)) {
      return res.status(400).json({
        error: { message: 'Both lat and lng query parameters must be provided for location-based distance search.' }
      });
    }

    if (hasLat && (isNaN(parseFloat(lat)) || Math.abs(parseFloat(lat)) > 90)) {
      return res.status(400).json({ error: { message: 'Latitude must be a valid number between -90 and 90.' } });
    }

    if (hasLng && (isNaN(parseFloat(lng)) || Math.abs(parseFloat(lng)) > 180)) {
      return res.status(400).json({ error: { message: 'Longitude must be a valid number between -180 and 180.' } });
    }

    if (radius !== undefined && (isNaN(parseFloat(radius)) || parseFloat(radius) <= 0)) {
      return res.status(400).json({ error: { message: 'Radius must be a positive number in miles.' } });
    }

    const result = await listingService.getListings({
      lat: hasLat ? parseFloat(lat) : undefined,
      lng: hasLng ? parseFloat(lng) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
      category,
      keyword,
      page,
      limit
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for fetching a single listing by ID (GET /api/listings/:id).
 * Public endpoint.
 */
export async function getListingById(req, res, next) {
  try {
    const { id } = req.params;
    const listing = await listingService.getListingById(id);
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for updating a listing (PATCH /api/listings/:id).
 * Owner only endpoint.
 */
export async function updateListing(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const listing = await listingService.updateListing({
      id,
      userId: req.user.id,
      title,
      description,
      category,
      photoUrl
    });

    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for soft-deleting a listing (DELETE /api/listings/:id).
 * Owner only endpoint.
 */
export async function deleteListing(req, res, next) {
  try {
    const { id } = req.params;

    const result = await listingService.deleteListing({
      id,
      userId: req.user.id
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
