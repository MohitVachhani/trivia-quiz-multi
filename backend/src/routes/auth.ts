import { Router } from 'express';
import { signup, login, getProfile } from '../controllers/authController';
import { authenticate, authenticateLocal } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/signup
 * Create a new user account
 * Public endpoint
 */
router.post('/signup', signup);

/**
 * POST /api/auth/login
 * Authenticate user with email/password
 * Uses Passport Local strategy
 * Public endpoint
 */
router.post('/login', authenticateLocal, login);

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 * Protected endpoint - requires JWT token
 */
router.get('/me', authenticate, getProfile);

/**
 * Future: Google OAuth routes
 *
 * router.get(
 *   '/google',
 *   passport.authenticate('google', { scope: ['profile', 'email'] })
 * );
 *
 * router.get(
 *   '/google/callback',
 *   passport.authenticate('google', { session: false }),
 *   (req, res) => {
 *     // Generate JWT and redirect to frontend with token
 *   }
 * );
 */

export default router;
