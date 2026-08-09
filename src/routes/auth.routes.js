import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller.js';
import { validateSignup, validateLogin } from '../middlewares/validation.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
