import { Request, Response, NextFunction } from 'express';
import {
  createLobby as createLobbyModel,
  findLobbyByCode,
  findLobbyById,
  addPlayerIdToLobby,
  removePlayerIdFromLobby,
  updateLobbyStatus,
} from '../models/Lobby';
import {
  addPlayerToLobby as addPlayerToLobbyModel,
  removePlayerFromLobby as removePlayerFromLobbyModel,
  setPlayerReady,
  isPlayerInLobby,
} from '../models/LobbyPlayer';
import {
  getLobbyWithPlayers,
  areAllPlayersReady,
  isLobbyFull,
  validateLobbySettings,
  handleOwnerLeave,
} from '../services/lobbyService';
import { getTopicById } from '../models/Topic';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/apiResponse';

/**
 * POST /api/lobby/create
 * Create a new lobby
 */
export async function createLobby(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { topicIds, questionCount, difficulty, maxPlayers } = req.body;
    const { userId } = req.user!;

    // Validate input
    const validation = validateLobbySettings({
      ownerId: userId,
      topicIds,
      questionCount,
      difficulty,
      maxPlayers,
    });

    if (!validation.valid) {
      throw ApiError.badRequest(
        'INVALID_LOBBY_SETTINGS',
        validation.errors.join(', ')
      );
    }

    // Verify all topics exist
    for (const topicId of topicIds) {
      const topic = await getTopicById(topicId);
      if (!topic) {
        throw ApiError.notFound(
          'TOPIC_NOT_FOUND',
          `Topic with ID ${topicId} not found`
        );
      }
    }

    // Create lobby
    const lobby = await createLobbyModel({
      ownerId: userId,
      topicIds,
      questionCount,
      difficulty,
      maxPlayers,
    });

    // Add owner to lobby_players (auto-ready)
    await addPlayerToLobbyModel(lobby.id, userId);
    await setPlayerReady(lobby.id, userId, true);

    // Add owner ID to lobby.player_ids
    await addPlayerIdToLobby(lobby.id, userId);

    // Get enriched lobby with players
    const lobbyWithPlayers = await getLobbyWithPlayers(lobby.id);

    sendSuccess(res, { lobby: lobbyWithPlayers }, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/lobby/join
 * Join an existing lobby with invite code
 */
export async function joinLobby(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code } = req.body;
    const { userId } = req.user!;

    if (!code) {
      throw ApiError.badRequest('MISSING_CODE', 'Lobby code is required');
    }

    // Find lobby by code
    const lobby = await findLobbyByCode(code);

    if (!lobby) {
      throw ApiError.notFound(
        'LOBBY_NOT_FOUND',
        'Invalid invite code'
      );
    }

    // Check lobby status
    if (lobby.status !== 'waiting') {
      throw ApiError.badRequest(
        'LOBBY_NOT_AVAILABLE',
        'Lobby has already started or is completed'
      );
    }

    // Check if user already in lobby
    const alreadyIn = await isPlayerInLobby(lobby.id, userId);
    if (alreadyIn) {
      throw ApiError.conflict(
        'ALREADY_IN_LOBBY',
        'You are already in this lobby'
      );
    }

    // Check if lobby is full
    const full = await isLobbyFull(lobby.id);
    if (full) {
      throw ApiError.badRequest(
        'LOBBY_FULL',
        'Lobby is full'
      );
    }

    // Add player to lobby
    await addPlayerToLobbyModel(lobby.id, userId);
    await addPlayerIdToLobby(lobby.id, userId);

    // Get enriched lobby
    const lobbyWithPlayers = await getLobbyWithPlayers(lobby.id);

    sendSuccess(res, { lobby: lobbyWithPlayers });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/lobby/:lobbyId
 * Get lobby details
 */
export async function getLobby(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { lobbyId } = req.params;
    const { userId } = req.user!;

    // Check if user is in lobby
    const inLobby = await isPlayerInLobby(lobbyId, userId);
    if (!inLobby) {
      throw ApiError.forbidden(
        'NOT_IN_LOBBY',
        'You are not a member of this lobby'
      );
    }

    // Get enriched lobby
    const lobbyWithPlayers = await getLobbyWithPlayers(lobbyId);

    sendSuccess(res, { lobby: lobbyWithPlayers });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/lobby/:lobbyId/ready
 * Toggle player ready status
 */
export async function toggleReady(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { lobbyId } = req.params;
    const { isReady } = req.body;
    const { userId } = req.user!;

    if (typeof isReady !== 'boolean') {
      throw ApiError.badRequest(
        'INVALID_READY_STATUS',
        'isReady must be a boolean'
      );
    }

    // Check if user is in lobby
    const inLobby = await isPlayerInLobby(lobbyId, userId);
    if (!inLobby) {
      throw ApiError.forbidden(
        'NOT_IN_LOBBY',
        'You are not a member of this lobby'
      );
    }

    // Get lobby
    const lobby = await findLobbyById(lobbyId);
    if (!lobby) {
      throw ApiError.notFound('LOBBY_NOT_FOUND', 'Lobby not found');
    }

    // Check if user is owner
    if (lobby.ownerId === userId) {
      throw ApiError.badRequest(
        'OWNER_ALWAYS_READY',
        'Lobby owner is always ready and cannot toggle status'
      );
    }

    // Update ready status
    await setPlayerReady(lobbyId, userId, isReady);

    sendSuccess(res, { isReady });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/lobby/:lobbyId/leave
 * Leave a lobby
 */
export async function leaveLobby(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { lobbyId } = req.params;
    const { userId } = req.user!;

    // Check if user is in lobby
    const inLobby = await isPlayerInLobby(lobbyId, userId);
    if (!inLobby) {
      throw ApiError.badRequest(
        'NOT_IN_LOBBY',
        'You are not a member of this lobby'
      );
    }

    // Get lobby
    const lobby = await findLobbyById(lobbyId);
    if (!lobby) {
      throw ApiError.notFound('LOBBY_NOT_FOUND', 'Lobby not found');
    }

    // Remove player from lobby
    await removePlayerFromLobbyModel(lobbyId, userId);
    await removePlayerIdFromLobby(lobbyId, userId);

    // If user is owner, handle ownership transfer or archiving
    if (lobby.ownerId === userId) {
      await handleOwnerLeave(lobbyId);
    }

    sendSuccess(res, { message: 'Left lobby successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/lobby/:lobbyId/start
 * Start the game (owner only)
 */
export async function startGame(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { lobbyId } = req.params;
    const { userId } = req.user!;

    // Get lobby
    const lobby = await findLobbyById(lobbyId);
    if (!lobby) {
      throw ApiError.notFound('LOBBY_NOT_FOUND', 'Lobby not found');
    }

    // Check if user is owner
    if (lobby.ownerId !== userId) {
      throw ApiError.forbidden(
        'NOT_OWNER',
        'Only lobby owner can start the game'
      );
    }

    // Check lobby status
    if (lobby.status !== 'waiting') {
      throw ApiError.badRequest(
        'LOBBY_NOT_WAITING',
        'Lobby is not in waiting status'
      );
    }

    // Check at least 2 players
    if (lobby.playerIds.length < 2) {
      throw ApiError.badRequest(
        'NOT_ENOUGH_PLAYERS',
        'At least 2 players required to start the game'
      );
    }

    // Check all non-owner players are ready
    const allReady = await areAllPlayersReady(lobbyId, userId);
    if (!allReady) {
      throw ApiError.badRequest(
        'PLAYERS_NOT_READY',
        'All players must be ready before starting'
      );
    }

    // TODO: In Milestone 5, implement game creation logic here
    // For now, return a placeholder message
    throw ApiError.internal(
      'GAME_CREATION_NOT_IMPLEMENTED',
      'Game creation will be implemented in Milestone 5'
    );

    // Future implementation:
    // 1. Select questions using questionSelectionService
    // 2. Create game record
    // 3. Update lobby status to 'in_progress'
    // 4. Set lobby.current_game_id
    // 5. Return gameId
  } catch (error) {
    next(error);
  }
}
