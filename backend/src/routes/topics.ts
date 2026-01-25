import { Router } from 'express';
import { getTopics, getTopic } from '../controllers/topicController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/quiz/topics
 * Get all available topics
 * Protected endpoint - requires JWT token
 */
router.get('/topics', authenticate, getTopics);

/**
 * GET /api/quiz/topics/:id
 * Get a single topic by ID
 * Protected endpoint - requires JWT token
 */
router.get('/topics/:id', authenticate, getTopic);

export default router;
