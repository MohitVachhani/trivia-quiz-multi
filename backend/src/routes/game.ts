import { Router } from 'express';
import {
  getGameState,
  getCurrentQuestion,
  submitAnswer,
  getGameResults,
} from '../controllers/gameController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/game/:gameId
 * Get game state (game, player progress, leaderboard)
 * Protected endpoint - requires JWT token
 */
router.get('/:gameId', authenticate, getGameState);

/**
 * GET /api/game/:gameId/question/current
 * Get current question for the authenticated player
 * Protected endpoint - requires JWT token
 */
router.get('/:gameId/question/current', authenticate, getCurrentQuestion);

/**
 * POST /api/game/:gameId/answer
 * Submit answer for current question
 * Protected endpoint - requires JWT token
 */
router.post('/:gameId/answer', authenticate, submitAnswer);

/**
 * GET /api/game/:gameId/results
 * Get final game results with leaderboard
 * Protected endpoint - requires JWT token
 */
router.get('/:gameId/results', authenticate, getGameResults);

export default router;
