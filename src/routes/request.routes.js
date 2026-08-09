import { Router } from 'express';
import {
  createRequest,
  acceptRequest,
  declineRequest,
  completeRequest,
  getUserRequests
} from '../controllers/request.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All request routes require authentication
router.post('/', authenticate, createRequest);
router.get('/my', authenticate, getUserRequests);
router.patch('/:id/accept', authenticate, acceptRequest);
router.patch('/:id/decline', authenticate, declineRequest);
router.patch('/:id/complete', authenticate, completeRequest);

export default router;
