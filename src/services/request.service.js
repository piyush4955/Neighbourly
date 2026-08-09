import { prisma } from '../config/db.js';
import { sanitizeUser } from '../utils/response.js';

/**
 * Guarded state machine for request status transitions.
 * AGENTS.md Rule 2: Enforces valid transitions and rejects invalid ones with HTTP 400.
 *
 * Valid transitions:
 *   PENDING  -> ACCEPTED  (owner only)
 *   PENDING  -> DECLINED  (owner only, terminal)
 *   ACCEPTED -> COMPLETED (owner or requester, terminal)
 */
const VALID_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'DECLINED'],
  ACCEPTED: ['COMPLETED'],
  DECLINED: [],  // terminal
  COMPLETED: [] // terminal
};

/**
 * Validates a requested status transition.
 * @param {string} currentStatus - Current request status
 * @param {string} targetStatus - Desired target status
 * @throws {Error} HTTP 400 if the transition is invalid
 */
function validateStateTransition(currentStatus, targetStatus) {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];

  if (!allowedTransitions) {
    const error = new Error(`Unknown current status: '${currentStatus}'`);
    error.statusCode = 400;
    throw error;
  }

  if (!allowedTransitions.includes(targetStatus)) {
    const isTerminal = allowedTransitions.length === 0;
    const message = isTerminal
      ? `Cannot change status: request is already in a terminal state ('${currentStatus.toLowerCase()}')`
      : `Invalid status transition from '${currentStatus.toLowerCase()}' to '${targetStatus.toLowerCase()}'. Allowed: ${allowedTransitions.map(s => `'${s.toLowerCase()}'`).join(', ')}`;

    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Fetches a request by ID including its listing and requester.
 * Throws 404 if not found.
 */
async function getRequestOrThrow(requestId) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      listing: true,
      requester: true
    }
  });

  if (!request) {
    const error = new Error('Request not found');
    error.statusCode = 404;
    throw error;
  }

  return request;
}

/**
 * Creates a new borrow/help request on an active listing.
 * Rules:
 *  - Requester cannot be the listing owner.
 *  - No duplicate pending requests from the same user on the same listing.
 */
export async function createRequest({ listingId, requesterId }) {
  // Fetch the target listing
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, isActive: true }
  });

  if (!listing) {
    const error = new Error('Listing not found or is no longer active');
    error.statusCode = 404;
    throw error;
  }

  // Prevent self-request
  if (listing.ownerId === requesterId) {
    const error = new Error('You cannot request your own listing');
    error.statusCode = 400;
    throw error;
  }

  // Prevent duplicate pending requests
  const existingPending = await prisma.request.findFirst({
    where: {
      listingId,
      requesterId,
      status: 'PENDING'
    }
  });

  if (existingPending) {
    const error = new Error('You already have a pending request for this listing');
    error.statusCode = 400;
    throw error;
  }

  const request = await prisma.request.create({
    data: {
      listingId,
      requesterId,
      status: 'PENDING'
    },
    include: {
      listing: true,
      requester: true
    }
  });

  return serializeRequest(request);
}

/**
 * Accepts a request: PENDING -> ACCEPTED.
 * Only the listing owner may accept.
 */
export async function acceptRequest({ requestId, userId }) {
  const request = await getRequestOrThrow(requestId);

  // Guard: Owner-only authorization
  if (request.listing.ownerId !== userId) {
    const error = new Error('Forbidden: Only the listing owner can accept a request');
    error.statusCode = 403;
    throw error;
  }

  // Guard: State machine transition validation
  validateStateTransition(request.status, 'ACCEPTED');

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: 'ACCEPTED' },
    include: { listing: true, requester: true }
  });

  return serializeRequest(updated);
}

/**
 * Declines a request: PENDING -> DECLINED (terminal).
 * Only the listing owner may decline.
 */
export async function declineRequest({ requestId, userId }) {
  const request = await getRequestOrThrow(requestId);

  // Guard: Owner-only authorization
  if (request.listing.ownerId !== userId) {
    const error = new Error('Forbidden: Only the listing owner can decline a request');
    error.statusCode = 403;
    throw error;
  }

  // Guard: State machine transition validation
  validateStateTransition(request.status, 'DECLINED');

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: 'DECLINED' },
    include: { listing: true, requester: true }
  });

  return serializeRequest(updated);
}

/**
 * Completes a request: ACCEPTED -> COMPLETED (terminal).
 * Either the listing owner OR the requester may complete.
 */
export async function completeRequest({ requestId, userId }) {
  const request = await getRequestOrThrow(requestId);

  const isOwner = request.listing.ownerId === userId;
  const isRequester = request.requesterId === userId;

  // Guard: Only owner or requester may complete
  if (!isOwner && !isRequester) {
    const error = new Error('Forbidden: Only the listing owner or the requester can complete a request');
    error.statusCode = 403;
    throw error;
  }

  // Guard: State machine transition validation
  validateStateTransition(request.status, 'COMPLETED');

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: 'COMPLETED' },
    include: { listing: true, requester: true }
  });

  return serializeRequest(updated);
}

/**
 * Returns all requests sent by or received by the authenticated user.
 */
export async function getUserRequests({ userId }) {
  const [sent, received] = await Promise.all([
    // Requests the user submitted as a requester
    prisma.request.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      include: { listing: { include: { owner: true } }, requester: true }
    }),
    // Requests the user received as a listing owner
    prisma.request.findMany({
      where: { listing: { ownerId: userId } },
      orderBy: { createdAt: 'desc' },
      include: { listing: true, requester: true }
    })
  ]);

  return {
    sent: sent.map(serializeRequest),
    received: received.map(serializeRequest)
  };
}

/**
 * Fetches a single request by ID.
 * Only the requester or the listing owner may view it (403 for anyone else).
 * Email addresses (requesterEmail, ownerEmail) are included only when
 * status is ACCEPTED or COMPLETED — not while the request is pending or declined.
 */
export async function getRequestById({ requestId, userId }) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      listing: { include: { owner: true } },
      requester: true
    }
  });

  if (!request) {
    const error = new Error('Request not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = request.listing.ownerId === userId;
  const isRequester = request.requesterId === userId;

  if (!isOwner && !isRequester) {
    const error = new Error('Forbidden: You do not have access to this request');
    error.statusCode = 403;
    throw error;
  }

  return serializeRequest(request, { includeEmails: true });
}

/**
 * Serializes a request record for API response.
 * @param {Object} request - Prisma request record with listing and requester includes
 * @param {{ includeEmails?: boolean }} opts - If includeEmails is true and status is
 *   ACCEPTED or COMPLETED, requesterEmail and ownerEmail are included in the response.
 *   This is intentionally never surfaced on PENDING or DECLINED requests so that
 *   contact details are only exchanged once a match is confirmed.
 */
function serializeRequest(request, { includeEmails = false } = {}) {
  const contactUnlocked =
    includeEmails &&
    (request.status === 'ACCEPTED' || request.status === 'COMPLETED');

  return {
    id: request.id,
    listingId: request.listingId,
    requesterId: request.requesterId,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    ...(contactUnlocked && request.requester ? { requesterEmail: request.requester.email } : {}),
    ...(contactUnlocked && request.listing?.owner ? { ownerEmail: request.listing.owner.email } : {}),
    listing: request.listing
      ? {
          id: request.listing.id,
          title: request.listing.title,
          type: request.listing.type,
          category: request.listing.category,
          ownerId: request.listing.ownerId
        }
      : null,
    requester: request.requester ? sanitizeUser(request.requester) : null
  };
}
