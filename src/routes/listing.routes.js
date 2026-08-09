import { Router } from 'express';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing
} from '../controllers/listing.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { uploadPhoto } from '../middlewares/upload.middleware.js';
import { validateCreateListing, validateUpdateListing } from '../middlewares/validation.middleware.js';

const router = Router();

// Public routes (No auth required)
router.get('/', getListings);
router.get('/:id', getListingById);

// Protected routes (JWT Auth required)
router.post('/', authenticate, uploadPhoto, validateCreateListing, createListing);
router.patch('/:id', authenticate, uploadPhoto, validateUpdateListing, updateListing);
router.delete('/:id', authenticate, deleteListing);

export default router;
