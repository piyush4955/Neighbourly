import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import listingRoutes from './listing.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/listings', listingRoutes);

export default router;
