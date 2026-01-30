import { pool } from '../config/database';
import { QueryResult } from 'pg';

export interface AnswerSubmission {
  id: string;
  gameId: string;
  userId: string;
  questionId: string;
  answerIds: string[];
  isCorrect: boolean;
  timeRemaining: number;
  pointsEarned: number;
  submittedAt: Date;
}

export interface SubmitAnswerInput {
  gameId: string;
  userId: string;
  questionId: string;
  answerIds: string[];
  timeRemaining: number;
}

interface AnswerSubmissionRow {
  id: string;
  game_id: string;
  user_id: string;
  question_id: string;
  answer_ids: string[];
  is_correct: boolean;
  time_remaining: number;
  points_earned: number;
  submitted_at: Date;
}

/**
 * Parse database row to AnswerSubmission object
 */
function parseAnswerSubmission(row: AnswerSubmissionRow): AnswerSubmission {
  return {
    id: row.id,
    gameId: row.game_id,
    userId: row.user_id,
    questionId: row.question_id,
    answerIds: row.answer_ids,
    isCorrect: row.is_correct,
    timeRemaining: row.time_remaining,
    pointsEarned: row.points_earned,
    submittedAt: row.submitted_at,
  };
}

/**
 * Submit an answer
 */
export async function submitAnswer(
  input: SubmitAnswerInput,
  isCorrect: boolean,
  points: number
): Promise<AnswerSubmission> {
  const query = `
    INSERT INTO trivia.answer_submissions (
      game_id, user_id, question_id, answer_ids,
      is_correct, time_remaining, points_earned
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id, game_id, user_id, question_id, answer_ids,
      is_correct, time_remaining, points_earned, submitted_at
  `;

  const result: QueryResult<AnswerSubmissionRow> = await pool.query(query, [
    input.gameId,
    input.userId,
    input.questionId,
    input.answerIds,
    isCorrect,
    input.timeRemaining,
    points,
  ]);

  return parseAnswerSubmission(result.rows[0]);
}

/**
 * Check if user has already answered this question
 */
export async function hasAnswered(
  gameId: string,
  userId: string,
  questionId: string
): Promise<boolean> {
  const query = `
    SELECT EXISTS(
      SELECT 1
      FROM trivia.answer_submissions
      WHERE game_id = $1 AND user_id = $2 AND question_id = $3
    ) as exists
  `;

  const result = await pool.query(query, [gameId, userId, questionId]);
  return result.rows[0].exists;
}

/**
 * Get all answers submitted by a player in a game
 */
export async function getPlayerAnswers(
  gameId: string,
  userId: string
): Promise<AnswerSubmission[]> {
  const query = `
    SELECT
      id, game_id, user_id, question_id, answer_ids,
      is_correct, time_remaining, points_earned, submitted_at
    FROM trivia.answer_submissions
    WHERE game_id = $1 AND user_id = $2
    ORDER BY submitted_at ASC
  `;

  const result: QueryResult<AnswerSubmissionRow> = await pool.query(query, [
    gameId,
    userId,
  ]);

  return result.rows.map(parseAnswerSubmission);
}

/**
 * Get count of correct answers for a player in a game
 */
export async function getCorrectAnswersCount(
  gameId: string,
  userId: string
): Promise<number> {
  const query = `
    SELECT COUNT(*)::int as count
    FROM trivia.answer_submissions
    WHERE game_id = $1 AND user_id = $2 AND is_correct = true
  `;

  const result = await pool.query(query, [gameId, userId]);
  return result.rows[0].count;
}
