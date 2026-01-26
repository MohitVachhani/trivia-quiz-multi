import { pool } from '../config/database';
import { QueryResult } from 'pg';

export interface LobbyPlayer {
  id: string;
  lobbyId: string;
  userId: string;
  isReady: boolean;
  joinedAt: Date;
}

interface LobbyPlayerRow {
  id: string;
  lobby_id: string;
  user_id: string;
  is_ready: boolean;
  joined_at: Date;
}

/**
 * Parse database row to LobbyPlayer object
 */
function parseLobbyPlayer(row: LobbyPlayerRow): LobbyPlayer {
  return {
    id: row.id,
    lobbyId: row.lobby_id,
    userId: row.user_id,
    isReady: row.is_ready,
    joinedAt: row.joined_at,
  };
}

/**
 * Add a player to a lobby
 */
export async function addPlayerToLobby(
  lobbyId: string,
  userId: string
): Promise<LobbyPlayer> {
  const query = `
    INSERT INTO trivia.lobby_players (lobby_id, user_id, is_ready)
    VALUES ($1, $2, false)
    RETURNING id, lobby_id, user_id, is_ready, joined_at
  `;

  const result: QueryResult<LobbyPlayerRow> = await pool.query(query, [
    lobbyId,
    userId,
  ]);

  return parseLobbyPlayer(result.rows[0]);
}

/**
 * Remove a player from a lobby
 */
export async function removePlayerFromLobby(
  lobbyId: string,
  userId: string
): Promise<void> {
  const query = `
    DELETE FROM trivia.lobby_players
    WHERE lobby_id = $1 AND user_id = $2
  `;

  await pool.query(query, [lobbyId, userId]);
}

/**
 * Set player ready status
 */
export async function setPlayerReady(
  lobbyId: string,
  userId: string,
  isReady: boolean
): Promise<void> {
  const query = `
    UPDATE trivia.lobby_players
    SET is_ready = $1
    WHERE lobby_id = $2 AND user_id = $3
  `;

  await pool.query(query, [isReady, lobbyId, userId]);
}

/**
 * Get all players in a lobby (ordered by join time)
 */
export async function getLobbyPlayers(
  lobbyId: string
): Promise<LobbyPlayer[]> {
  const query = `
    SELECT id, lobby_id, user_id, is_ready, joined_at
    FROM trivia.lobby_players
    WHERE lobby_id = $1
    ORDER BY joined_at ASC
  `;

  const result: QueryResult<LobbyPlayerRow> = await pool.query(query, [
    lobbyId,
  ]);

  return result.rows.map(parseLobbyPlayer);
}

/**
 * Get count of ready players in a lobby
 */
export async function getPlayerReadyCount(lobbyId: string): Promise<number> {
  const query = `
    SELECT COUNT(*)::int as count
    FROM trivia.lobby_players
    WHERE lobby_id = $1 AND is_ready = true
  `;

  const result = await pool.query(query, [lobbyId]);
  return result.rows[0].count;
}

/**
 * Check if a user is in a lobby
 */
export async function isPlayerInLobby(
  lobbyId: string,
  userId: string
): Promise<boolean> {
  const query = `
    SELECT EXISTS(
      SELECT 1 FROM trivia.lobby_players
      WHERE lobby_id = $1 AND user_id = $2
    ) as exists
  `;

  const result = await pool.query(query, [lobbyId, userId]);
  return result.rows[0].exists;
}
