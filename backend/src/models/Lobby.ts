import { pool } from '../config/database';
import { QueryResult } from 'pg';

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface Lobby {
  id: string;
  code: string;
  ownerId: string;
  topicIds: string[];
  playerIds: string[];
  status: 'waiting' | 'in_progress' | 'completed';
  maxPlayers: number;
  questionCount: number;
  difficulty: DifficultyDistribution;
  currentGameId: string | null;
  createdAt: Date;
  startedAt: Date | null;
  expiresAt: Date;
  archivedAt: Date | null;
}

export interface CreateLobbyInput {
  ownerId: string;
  topicIds: string[];
  questionCount: number;
  difficulty: DifficultyDistribution;
  maxPlayers: number;
}

interface LobbyRow {
  id: string;
  code: string;
  owner_id: string;
  topic_ids: string[];
  player_ids: string[];
  status: string;
  max_players: number;
  question_count: number;
  difficulty: any; // JSONB
  current_game_id: string | null;
  created_at: Date;
  started_at: Date | null;
  expires_at: Date;
  archived_at: Date | null;
}

/**
 * Parse database row to Lobby object
 */
function parseLobby(row: LobbyRow): Lobby {
  return {
    id: row.id,
    code: row.code,
    ownerId: row.owner_id,
    topicIds: row.topic_ids,
    playerIds: row.player_ids,
    status: row.status as Lobby['status'],
    maxPlayers: row.max_players,
    questionCount: row.question_count,
    difficulty: row.difficulty,
    currentGameId: row.current_game_id,
    createdAt: row.created_at,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    archivedAt: row.archived_at,
  };
}

/**
 * Generate a unique 6-character alphanumeric lobby code
 */
export async function generateLobbyCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  // Generate 6-character code
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // Check uniqueness
  const existing = await findLobbyByCode(code);

  // If collision, recursively generate new code
  if (existing) {
    return generateLobbyCode();
  }

  return code;
}

/**
 * Create a new lobby
 */
export async function createLobby(input: CreateLobbyInput): Promise<Lobby> {
  const code = await generateLobbyCode();

  const query = `
    INSERT INTO trivia.lobbies (
      code, owner_id, topic_ids, player_ids, status,
      max_players, question_count, difficulty, expires_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '1 hour')
    RETURNING
      id, code, owner_id, topic_ids, player_ids, status,
      max_players, question_count, difficulty, current_game_id,
      created_at, started_at, expires_at, archived_at
  `;

  const result: QueryResult<LobbyRow> = await pool.query(query, [
    code,
    input.ownerId,
    input.topicIds,
    [], // player_ids starts empty, will be populated via addPlayerIdToLobby
    'waiting',
    input.maxPlayers,
    input.questionCount,
    JSON.stringify(input.difficulty),
  ]);

  return parseLobby(result.rows[0]);
}

/**
 * Find lobby by ID
 */
export async function findLobbyById(id: string): Promise<Lobby | null> {
  const query = `
    SELECT
      id, code, owner_id, topic_ids, player_ids, status,
      max_players, question_count, difficulty, current_game_id,
      created_at, started_at, expires_at, archived_at
    FROM trivia.lobbies
    WHERE id = $1 AND archived_at IS NULL
  `;

  const result: QueryResult<LobbyRow> = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return parseLobby(result.rows[0]);
}

/**
 * Find lobby by code (case-insensitive)
 */
export async function findLobbyByCode(code: string): Promise<Lobby | null> {
  const query = `
    SELECT
      id, code, owner_id, topic_ids, player_ids, status,
      max_players, question_count, difficulty, current_game_id,
      created_at, started_at, expires_at, archived_at
    FROM trivia.lobbies
    WHERE UPPER(code) = UPPER($1) AND archived_at IS NULL
  `;

  const result: QueryResult<LobbyRow> = await pool.query(query, [code]);

  if (result.rows.length === 0) {
    return null;
  }

  return parseLobby(result.rows[0]);
}

/**
 * Update lobby status
 */
export async function updateLobbyStatus(
  id: string,
  status: Lobby['status']
): Promise<void> {
  let query = `
    UPDATE trivia.lobbies
    SET status = $1
  `;

  const params: any[] = [status];

  // Set started_at when transitioning to in_progress
  if (status === 'in_progress') {
    query += `, started_at = NOW()`;
  }

  query += ` WHERE id = $2`;
  params.push(id);

  await pool.query(query, params);
}

/**
 * Set current game ID
 */
export async function setCurrentGameId(
  lobbyId: string,
  gameId: string | null
): Promise<void> {
  const query = `
    UPDATE trivia.lobbies
    SET current_game_id = $1
    WHERE id = $2
  `;

  await pool.query(query, [gameId, lobbyId]);
}

/**
 * Add player ID to lobby's player_ids array
 */
export async function addPlayerIdToLobby(
  lobbyId: string,
  userId: string
): Promise<void> {
  const query = `
    UPDATE trivia.lobbies
    SET player_ids = array_append(player_ids, $1)
    WHERE id = $2
  `;

  await pool.query(query, [userId, lobbyId]);
}

/**
 * Remove player ID from lobby's player_ids array
 */
export async function removePlayerIdFromLobby(
  lobbyId: string,
  userId: string
): Promise<void> {
  const query = `
    UPDATE trivia.lobbies
    SET player_ids = array_remove(player_ids, $1)
    WHERE id = $2
  `;

  await pool.query(query, [userId, lobbyId]);
}

/**
 * Update lobby owner
 */
export async function updateLobbyOwner(
  lobbyId: string,
  newOwnerId: string
): Promise<void> {
  const query = `
    UPDATE trivia.lobbies
    SET owner_id = $1
    WHERE id = $2
  `;

  await pool.query(query, [newOwnerId, lobbyId]);
}

/**
 * Archive lobby (soft delete)
 */
export async function archiveLobby(lobbyId: string): Promise<void> {
  const query = `
    UPDATE trivia.lobbies
    SET archived_at = NOW(), status = 'completed'
    WHERE id = $1
  `;

  await pool.query(query, [lobbyId]);
}
