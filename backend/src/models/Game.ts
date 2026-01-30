import { pool } from '../config/database';
import { QueryResult } from 'pg';

export interface Game {
  id: string;
  lobbyId: string;
  topicIds: string[];
  playerIds: string[];
  questionIds: string[];
  status: 'waiting' | 'in_progress' | 'completed';
  totalQuestions: number;
  startedAt: Date;
  completedAt: Date | null;
}

export interface CreateGameInput {
  lobbyId: string;
  topicIds: string[];
  playerIds: string[];
  questionIds: string[];
  totalQuestions: number;
}

interface GameRow {
  id: string;
  lobby_id: string;
  topic_ids: string[];
  player_ids: string[];
  question_ids: string[];
  status: string;
  total_questions: number;
  started_at: Date;
  completed_at: Date | null;
}

/**
 * Parse database row to Game object
 */
function parseGame(row: GameRow): Game {
  return {
    id: row.id,
    lobbyId: row.lobby_id,
    topicIds: row.topic_ids,
    playerIds: row.player_ids,
    questionIds: row.question_ids,
    status: row.status as Game['status'],
    totalQuestions: row.total_questions,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

/**
 * Create a new game
 */
export async function createGame(input: CreateGameInput): Promise<Game> {
  const query = `
    INSERT INTO trivia.games (
      lobby_id, topic_ids, player_ids, question_ids,
      status, total_questions
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id, lobby_id, topic_ids, player_ids, question_ids,
      status, total_questions, started_at, completed_at
  `;

  const result: QueryResult<GameRow> = await pool.query(query, [
    input.lobbyId,
    input.topicIds,
    input.playerIds,
    input.questionIds,
    'in_progress',
    input.totalQuestions,
  ]);

  return parseGame(result.rows[0]);
}

/**
 * Find game by ID
 */
export async function findGameById(id: string): Promise<Game | null> {
  const query = `
    SELECT
      id, lobby_id, topic_ids, player_ids, question_ids,
      status, total_questions, started_at, completed_at
    FROM trivia.games
    WHERE id = $1
  `;

  const result: QueryResult<GameRow> = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return parseGame(result.rows[0]);
}

/**
 * Find game by lobby ID
 */
export async function findGameByLobbyId(lobbyId: string): Promise<Game | null> {
  const query = `
    SELECT
      id, lobby_id, topic_ids, player_ids, question_ids,
      status, total_questions, started_at, completed_at
    FROM trivia.games
    WHERE lobby_id = $1
    ORDER BY started_at DESC
    LIMIT 1
  `;

  const result: QueryResult<GameRow> = await pool.query(query, [lobbyId]);

  if (result.rows.length === 0) {
    return null;
  }

  return parseGame(result.rows[0]);
}

/**
 * Update game status
 */
export async function updateGameStatus(
  gameId: string,
  status: Game['status']
): Promise<void> {
  const query = `
    UPDATE trivia.games
    SET status = $1
    WHERE id = $2
  `;

  await pool.query(query, [status, gameId]);
}

/**
 * Complete game
 */
export async function completeGame(gameId: string): Promise<void> {
  const query = `
    UPDATE trivia.games
    SET status = 'completed', completed_at = NOW()
    WHERE id = $1
  `;

  await pool.query(query, [gameId]);
}
