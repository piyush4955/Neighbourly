import { prisma } from '../config/db.js';
import { sanitizeUser } from '../utils/response.js';
import { formatDistance } from './location.service.js';

/**
 * Creates a new TOOL listing associated with the authenticated user.
 */
export async function createListing({ ownerId, title, description, category, photoUrl }) {
  const listing = await prisma.listing.create({
    data: {
      ownerId,
      type: 'TOOL',
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      photoUrl: photoUrl || null,
      isActive: true
    },
    include: {
      owner: true
    }
  });

  return {
    ...listing,
    owner: sanitizeUser(listing.owner)
  };
}

/**
 * Retrieves active TOOL listings with database-level PostGIS spatial distance filtering,
 * category/keyword filters, and pagination.
 */
export async function getListings({ lat, lng, radius, category, keyword, page = 1, limit = 20 } = {}) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offsetNum = (pageNum - 1) * limitNum;

  const hasLocation = lat !== undefined && lng !== undefined && lat !== null && lng !== null;
  const parsedLat = hasLocation ? parseFloat(lat) : null;
  const parsedLng = hasLocation ? parseFloat(lng) : null;
  const radiusMiles = radius ? parseFloat(radius) : 10;
  const radiusMeters = radiusMiles * 1609.34;

  const categoryFilter = category && category.trim().length > 0 ? category.trim() : null;
  const keywordFilter = keyword && keyword.trim().length > 0 ? `%${keyword.trim()}%` : null;

  // Execute database-level PostGIS spatial query via Prisma $queryRaw
  const rawListings = await prisma.$queryRaw`
    SELECT 
      l.id,
      l.owner_id AS "ownerId",
      l.type,
      l.title,
      l.description,
      l.category,
      l.photo_url AS "photoUrl",
      l.is_active AS "isActive",
      l.created_at AS "createdAt",
      u.id AS "user_id",
      u.name AS "user_name",
      u.email AS "user_email",
      u.bio AS "user_bio",
      u.created_at AS "user_created_at",
      u.avg_rating AS "user_avg_rating",
      ST_AsText(u.approx_location) AS "user_approx_location",
      CASE 
        WHEN ${hasLocation}::boolean = true THEN 
          ST_Distance(u.approx_location, ST_SetSRID(ST_MakePoint(${parsedLng}::float, ${parsedLat}::float), 4326)::geography) / 1609.34 
        ELSE NULL 
      END AS "distance_miles"
    FROM listings l
    JOIN users u ON l.owner_id = u.id
    WHERE l.is_active = true
      AND l.type = 'TOOL'
      AND (
        ${hasLocation}::boolean = false 
        OR ST_DWithin(u.approx_location, ST_SetSRID(ST_MakePoint(${parsedLng}::float, ${parsedLat}::float), 4326)::geography, ${radiusMeters}::float)
      )
      AND (${categoryFilter}::text IS NULL OR LOWER(l.category) = LOWER(${categoryFilter}))
      AND (${keywordFilter}::text IS NULL OR l.title ILIKE ${keywordFilter} OR l.description ILIKE ${keywordFilter})
    ORDER BY 
      CASE WHEN ${hasLocation}::boolean = true THEN 
        ST_Distance(u.approx_location, ST_SetSRID(ST_MakePoint(${parsedLng}::float, ${parsedLat}::float), 4326)::geography) 
      END ASC NULLS LAST,
      l.created_at DESC
    LIMIT ${limitNum} OFFSET ${offsetNum};
  `;

  // Count total matching records for pagination metadata
  const countResult = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM listings l
    JOIN users u ON l.owner_id = u.id
    WHERE l.is_active = true
      AND l.type = 'TOOL'
      AND (
        ${hasLocation}::boolean = false 
        OR ST_DWithin(u.approx_location, ST_SetSRID(ST_MakePoint(${parsedLng}::float, ${parsedLat}::float), 4326)::geography, ${radiusMeters}::float)
      )
      AND (${categoryFilter}::text IS NULL OR LOWER(l.category) = LOWER(${categoryFilter}))
      AND (${keywordFilter}::text IS NULL OR l.title ILIKE ${keywordFilter} OR l.description ILIKE ${keywordFilter});
  `;

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limitNum) || 1;

  // Transform raw SQL rows into clean domain objects
  const listings = rawListings.map((row) => {
    const rawDist = row.distance_miles !== null ? parseFloat(row.distance_miles) : null;
    const distanceMiles = rawDist !== null ? Math.round(rawDist * 10) / 10 : null;

    const ownerRaw = {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      bio: row.user_bio,
      createdAt: row.user_created_at,
      avgRating: row.user_avg_rating,
      approxLocation: row.user_approx_location
    };

    return {
      id: row.id,
      ownerId: row.ownerId,
      type: row.type,
      title: row.title,
      description: row.description,
      category: row.category,
      photoUrl: row.photoUrl,
      isActive: row.isActive,
      createdAt: row.createdAt,
      distance: formatDistance(rawDist),
      distanceMiles,
      owner: sanitizeUser(ownerRaw)
    };
  });

  return {
    listings,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    }
  };
}

/**
 * Retrieves a single active listing by ID.
 */
export async function getListingById(id) {
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      isActive: true
    },
    include: {
      owner: true
    }
  });

  if (!listing) {
    const error = new Error('Listing not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    ...listing,
    owner: sanitizeUser(listing.owner)
  };
}

/**
 * Updates a listing. Enforces that only the listing's owner can edit it.
 */
export async function updateListing({ id, userId, title, description, category, photoUrl }) {
  const existingListing = await prisma.listing.findUnique({
    where: { id }
  });

  if (!existingListing) {
    const error = new Error('Listing not found');
    error.statusCode = 404;
    throw error;
  }

  if (existingListing.ownerId !== userId) {
    const error = new Error('Forbidden: You are not the owner of this listing');
    error.statusCode = 403;
    throw error;
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description.trim();
  if (category !== undefined) updateData.category = category.trim();
  if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

  const updatedListing = await prisma.listing.update({
    where: { id },
    data: updateData,
    include: {
      owner: true
    }
  });

  return {
    ...updatedListing,
    owner: sanitizeUser(updatedListing.owner)
  };
}

/**
 * Soft deletes a listing by setting isActive = false. Enforces owner-only authorization.
 */
export async function deleteListing({ id, userId }) {
  const existingListing = await prisma.listing.findUnique({
    where: { id }
  });

  if (!existingListing) {
    const error = new Error('Listing not found');
    error.statusCode = 404;
    throw error;
  }

  if (existingListing.ownerId !== userId) {
    const error = new Error('Forbidden: You are not the owner of this listing');
    error.statusCode = 403;
    throw error;
  }

  await prisma.listing.update({
    where: { id },
    data: { isActive: false }
  });

  return { message: 'Listing soft-deleted successfully', id };
}
