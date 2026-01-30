import { pool } from '../config/database';
import { QueryResult } from 'pg';

export interface PlayerProgress {
  id: string;
  gameId: string;
  userId: string;
  currentQuestionIndex: number;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlayerProgressRow {
  id: string;
  game_id: string;
  user_id: string;
  current_question_index: number;
  score: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Parse database row to PlayerProgress object
 */
function parsePlayerProgress(row: PlayerProgressRow): PlayerProgress {
  return {
    id: row.id,
    gameId: row.game_id,
    userId: row.user_id,
    currentQuestionIndex: row.current_question_index,
    score: row.score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create player progress record
 */
export async function createPlayerProgress(
  gameId: string,
  userId: string
): Promise<PlayerProgress> {
  const query = `
    INSERT INTO trivia.player_progress (game_id, user_id)
    VALUES ($1, $2)
    RETURNING
      id, game_id, user_id, current_question_index,
      score, created_at, updated_at
  `;

  const result: QueryResult<PlayerProgressRow> = await pool.query(query, [
    gameId,
    userId,
  ]);

  return parsePlayerProgress(result.rows[0]);
}

/**
 * Get player progress for a specific game and user
 */
export async function getPlayerProgress(
  gameId: string,
  userId: string
): Promise<PlayerProgress | null> {
  const query = `
    SELECT
      id, game_id, user_id, current_question_index,
      score, created_at, updated_at
    FROM trivia.player_progress
    WHERE game_id = $1 AND user_id = $2
  `;

  const result: QueryResult<PlayerProgressRow> = await pool.query(query, [
    gameId,
    userId,
  ]);

  if (result.rows.length === 0) {
    return null;
  }

  return parsePlayerProgress(result.rows[0]);
}

/**
 * Get all player progress for a game
 */
export async function getAllPlayerProgress(
  gameId: string
): Promise<PlayerProgress[]> {
  const query = `
    SELECT
      id, game_id, user_id, current_question_index,
      score, created_at, updated_at
    FROM trivia.player_progress
    WHERE game_id = $1
    ORDER BY score DESC
  `;

  const result: QueryResult<PlayerProgressRow> = await pool.query(query, [
    gameId,
  ]);

  return result.rows.map(parsePlayerProgress);
}

/**
 * Update player progress (index and score)
 */
export async function updatePlayerProgress(
  gameId: string,
  userId: string,
  index: number,
  score: number
): Promise<void> {
  const query = `
    UPDATE trivia.player_progress
    SET current_question_index = $3, score = $4, updated_at = NOW()
    WHERE game_id = $1 AND user_id = $2
  `;

  await pool.query(query, [gameId, userId, index, score]);
}

/**
 * Increment question index
 */
export async function incrementQuestionIndex(
  gameId: string,
  userId: string
): Promise<void> {
  const query = `
    UPDATE trivia.player_progress
    SET current_question_index = current_question_index + 1, updated_at = NOW()
    WHERE game_id = $1 AND user_id = $2
  `;

  await pool.query(query, [gameId, userId]);
}

/**
 * Add score to player
 */
export async function addScore(
  gameId: string,
  userId: string,
  points: number
): Promise<void> {
  const query = `
    UPDATE trivia.player_progress
    SET score = score + $3, updated_at = NOW()
    WHERE game_id = $1 AND user_id = $2
  `;

  await pool.query(query, [gameId, userId, points]);
}
