import { pool } from '../config/database';
import {
  Lobby,
  CreateLobbyInput,
  findLobbyById,
  updateLobbyOwner,
  archiveLobby,
} from '../models/Lobby';
import { getLobbyPlayers, setPlayerReady } from '../models/LobbyPlayer';
import { ApiError } from '../utils/ApiError';

export interface LobbyWithPlayers extends Lobby {
  players: Array<{
    id: string;
    email: string;
    isOwner: boolean;
    isReady: boolean;
    joinedAt: Date;
  }>;
}

/**
 * Get lobby with enriched player data (email, isOwner, isReady)
 */
export async function getLobbyWithPlayers(
  lobbyId: string
): Promise<LobbyWithPlayers> {
  const lobby = await findLobbyById(lobbyId);

  if (!lobby) {
    throw ApiError.notFound('LOBBY_NOT_FOUND', 'Lobby not found');
  }

  // Get lobby players with user details
  const query = `
    SELECT
      lp.user_id as id,
      u.email,
      lp.is_ready as "isReady",
      lp.joined_at as "joinedAt"
    FROM trivia.lobby_players lp
    JOIN trivia.users u ON lp.user_id = u.id
    WHERE lp.lobby_id = $1
    ORDER BY lp.joined_at ASC
  `;

  const result = await pool.query(query, [lobbyId]);

  const players = result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    isOwner: row.id === lobby.ownerId,
    isReady: row.isReady,
    joinedAt: row.joinedAt,
  }));

  return {
    ...lobby,
    players,
  };
}

/**
 * Check if all players (except owner) are ready
 */
export async function areAllPlayersReady(
  lobbyId: string,
  ownerId: string
): Promise<boolean> {
  const query = `
    SELECT COUNT(*)::int as total,
           SUM(CASE WHEN is_ready THEN 1 ELSE 0 END)::int as ready
    FROM trivia.lobby_players
    WHERE lobby_id = $1 AND user_id != $2
  `;

  const result = await pool.query(query, [lobbyId, ownerId]);
  const { total, ready } = result.rows[0];

  // If there are no other players, return false
  if (total === 0) {
    return false;
  }

  // All non-owner players must be ready
  return total === ready;
}

/**
 * Check if lobby is full
 */
export async function isLobbyFull(lobbyId: string): Promise<boolean> {
  const lobby = await findLobbyById(lobbyId);

  if (!lobby) {
    return false;
  }

  const players = await getLobbyPlayers(lobbyId);

  return players.length >= lobby.maxPlayers;
}

/**
 * Validate lobby settings
 */
export function validateLobbySettings(settings: CreateLobbyInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate topicIds
  if (!settings.topicIds || settings.topicIds.length === 0) {
    errors.push('At least one topic must be selected');
  }

  // Validate UUID format for topicIds
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  settings.topicIds.forEach((id) => {
    if (!uuidRegex.test(id)) {
      errors.push(`Invalid topic ID format: ${id}`);
    }
  });

  // Validate questionCount
  if (settings.questionCount < 5 || settings.questionCount > 50) {
    errors.push('Question count must be between 5 and 50');
  }

  // Validate difficulty distribution
  const { easy, medium, hard } = settings.difficulty;

  if (easy < 0 || medium < 0 || hard < 0) {
    errors.push('Difficulty counts cannot be negative');
  }

  const totalDifficulty = easy + medium + hard;
  if (totalDifficulty !== settings.questionCount) {
    errors.push(
      `Difficulty distribution (${totalDifficulty}) must equal question count (${settings.questionCount})`
    );
  }

  // Validate maxPlayers
  if (settings.maxPlayers < 2 || settings.maxPlayers > 10) {
    errors.push('Max players must be between 2 and 10');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Handle owner leaving - transfer ownership or archive lobby
 */
export async function handleOwnerLeave(lobbyId: string): Promise<void> {
  // Get remaining players (ordered by join time)
  const players = await getLobbyPlayers(lobbyId);

  if (players.length === 0) {
    // No players left, archive the lobby
    await archiveLobby(lobbyId);
  } else {
    // Transfer ownership to the next player (first in line)
    const newOwner = players[0];
    await updateLobbyOwner(lobbyId, newOwner.userId);

    // Set new owner as ready
    await setPlayerReady(lobbyId, newOwner.userId, true);
  }
}
