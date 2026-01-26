import { Router } from 'express';
import {
  createLobby,
  joinLobby,
  getLobby,
  toggleReady,
  leaveLobby,
  startGame,
} from '../controllers/lobbyController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/lobby/create
 * Create a new game lobby
 * Protected endpoint - requires JWT token
 */
router.post('/create', authenticate, createLobby);

/**
 * POST /api/lobby/join
 * Join an existing lobby using invite code
 * Protected endpoint - requires JWT token
 */
router.post('/join', authenticate, joinLobby);

/**
 * GET /api/lobby/:lobbyId
 * Get lobby details
 * Protected endpoint - requires JWT token
 */
router.get('/:lobbyId', authenticate, getLobby);

/**
 * PATCH /api/lobby/:lobbyId/ready
 * Toggle player ready status
 * Protected endpoint - requires JWT token
 */
router.patch('/:lobbyId/ready', authenticate, toggleReady);

/**
 * DELETE /api/lobby/:lobbyId/leave
 * Leave a lobby
 * Protected endpoint - requires JWT token
 */
router.delete('/:lobbyId/leave', authenticate, leaveLobby);

/**
 * POST /api/lobby/:lobbyId/start
 * Start the game (owner only)
 * Protected endpoint - requires JWT token
 */
router.post('/:lobbyId/start', authenticate, startGame);

export default router;
