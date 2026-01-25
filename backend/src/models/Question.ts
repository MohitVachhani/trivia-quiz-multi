import { pool } from '../config/database';
import { QueryResult } from 'pg';

export interface QuestionOption {
  id: string;
  label: string; // "A", "B", "C", "D"
  text: string;
}

export interface Question {
  id: string;
  topicId: string;
  type: 'single_correct' | 'multi_correct' | 'true_false';
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: QuestionOption[];
  correctAnswerIds: string[];
  explanation: string | null;
  timesAsked: number;
  timesCorrect: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// For game flow - excludes correct answers and stats
export interface GameQuestion {
  id: string;
  topicId: string;
  type: 'single_correct' | 'multi_correct' | 'true_false';
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: QuestionOption[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface QuestionRow {
  id: string;
  topic_id: string;
  type: string;
  difficulty: string;
  text: string;
  options: any; // JSONB from database
  correct_answer_ids: string[];
  explanation: string | null;
  times_asked: number;
  times_correct: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Parse a database row into a Question object
 */
function parseQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    topicId: row.topic_id,
    type: row.type as Question['type'],
    difficulty: row.difficulty as Question['difficulty'],
    text: row.text,
    options: row.options, // Already parsed by pg driver
    correctAnswerIds: row.correct_answer_ids,
    explanation: row.explanation,
    timesAsked: row.times_asked,
    timesCorrect: row.times_correct,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Remove sensitive fields from question for gameplay
 */
export function sanitizeQuestionForGame(question: Question): GameQuestion {
  const { correctAnswerIds, explanation, timesAsked, timesCorrect, ...gameQuestion } = question;
  return gameQuestion;
}

/**
 * Get a full question by ID (includes correct answers)
 */
export async function getQuestionById(id: string): Promise<Question | null> {
  const query = `
    SELECT
      id, topic_id, type, difficulty, text, options,
      correct_answer_ids, explanation,
      times_asked, times_correct, is_active,
      created_at, updated_at
    FROM trivia.questions
    WHERE id = $1
  `;

  const result: QueryResult<QuestionRow> = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return parseQuestion(result.rows[0]);
}

/**
 * Get a question without correct answers (for gameplay)
 */
export async function getGameQuestionById(id: string): Promise<GameQuestion | null> {
  const fullQuestion = await getQuestionById(id);

  if (!fullQuestion) {
    return null;
  }

  return sanitizeQuestionForGame(fullQuestion);
}

/**
 * Get all questions for a specific topic
 */
export async function getQuestionsByTopic(topicId: string): Promise<Question[]> {
  const query = `
    SELECT
      id, topic_id, type, difficulty, text, options,
      correct_answer_ids, explanation,
      times_asked, times_correct, is_active,
      created_at, updated_at
    FROM trivia.questions
    WHERE topic_id = $1
    ORDER BY difficulty ASC, created_at DESC
  `;

  const result: QueryResult<QuestionRow> = await pool.query(query, [topicId]);
  return result.rows.map(parseQuestion);
}

/**
 * Get active questions filtered by topics and optional difficulty
 */
export async function getActiveQuestionsByTopics(
  topicIds: string[],
  difficulty?: 'easy' | 'medium' | 'hard'
): Promise<Question[]> {
  let query = `
    SELECT
      id, topic_id, type, difficulty, text, options,
      correct_answer_ids, explanation,
      times_asked, times_correct, is_active,
      created_at, updated_at
    FROM trivia.questions
    WHERE topic_id = ANY($1)
      AND is_active = true
  `;

  const params: any[] = [topicIds];

  if (difficulty) {
    query += ` AND difficulty = $2`;
    params.push(difficulty);
  }

  query += ` ORDER BY RANDOM()`;

  const result: QueryResult<QuestionRow> = await pool.query(query, params);
  return result.rows.map(parseQuestion);
}

/**
 * Get count of active questions by difficulty for given topics
 */
export async function getQuestionCountsByDifficulty(
  topicIds: string[]
): Promise<{ easy: number; medium: number; hard: number }> {
  const query = `
    SELECT
      difficulty,
      COUNT(*)::int as count
    FROM trivia.questions
    WHERE topic_id = ANY($1)
      AND is_active = true
    GROUP BY difficulty
  `;

  const result = await pool.query(query, [topicIds]);

  const counts = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  result.rows.forEach((row) => {
    counts[row.difficulty as keyof typeof counts] = row.count;
  });

  return counts;
}
