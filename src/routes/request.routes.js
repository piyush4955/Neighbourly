import { Router } from 'express';
import {
  createRequest,
  getRequestById,
  acceptRequest,
  declineRequest,
  completeRequest,
  getUserRequests
} from '../controllers/request.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All request routes require authentication
router.post('/', authenticate, createRequest);

// Static routes must be registered before parameterised /:id routes
router.get('/my', authenticate, getUserRequests);

// Parameterised routes
router.get('/:id', authenticate, getRequestById);
router.patch('/:id/accept', authenticate, acceptRequest);
router.patch('/:id/decline', authenticate, declineRequest);
router.patch('/:id/complete', authenticate, completeRequest);

export default router;
