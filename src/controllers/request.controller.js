import * as requestService from '../services/request.service.js';

/**
 * Controller for creating a request (POST /api/requests).
 */
export async function createRequest(req, res, next) {
  try {
    const { listingId } = req.body;
    const requesterId = req.user.id;

    const request = await requestService.createRequest({ listingId, requesterId });
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for accepting a request (PATCH /api/requests/:id/accept).
 * Owner only: PENDING -> ACCEPTED
 */
export async function acceptRequest(req, res, next) {
  try {
    const { id } = req.params;
    const request = await requestService.acceptRequest({ requestId: id, userId: req.user.id });
    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for declining a request (PATCH /api/requests/:id/decline).
 * Owner only: PENDING -> DECLINED
 */
export async function declineRequest(req, res, next) {
  try {
    const { id } = req.params;
    const request = await requestService.declineRequest({ requestId: id, userId: req.user.id });
    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for completing a request (PATCH /api/requests/:id/complete).
 * Owner OR requester: ACCEPTED -> COMPLETED
 */
export async function completeRequest(req, res, next) {
  try {
    const { id } = req.params;
    const request = await requestService.completeRequest({ requestId: id, userId: req.user.id });
    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for fetching a request by ID (GET /api/requests/:id).
 * Auth required — only the requester or listing owner may view.
 * Emails revealed only when status is ACCEPTED or COMPLETED.
 */
export async function getRequestById(req, res, next) {
  try {
    const { id } = req.params;
    const request = await requestService.getRequestById({ requestId: id, userId: req.user.id });
    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for fetching requests sent/received by the authenticated user (GET /api/requests/my).
 */
export async function getUserRequests(req, res, next) {
  try {
    const result = await requestService.getUserRequests({ userId: req.user.id });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
