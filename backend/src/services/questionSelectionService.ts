import { getActiveQuestionsByTopics, Question } from '../models/Question';
import { ApiError } from '../utils/ApiError';

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface QuestionSelectionOptions {
  topicIds: string[];
  distribution: DifficultyDistribution;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Select random questions from a pool
 */
function selectRandomQuestions(questions: Question[], count: number): Question[] {
  if (questions.length <= count) {
    return questions;
  }

  const shuffled = shuffleArray(questions);
  return shuffled.slice(0, count);
}

/**
 * Select questions for a game based on topics and difficulty distribution
 *
 * @param options - Configuration for question selection
 * @returns Array of question IDs in random order
 *
 * @throws ApiError if topicIds is empty
 */
export async function selectQuestionsForGame(
  options: QuestionSelectionOptions
): Promise<string[]> {
  const { topicIds, distribution } = options;

  // Validate input
  if (!topicIds || topicIds.length === 0) {
    throw ApiError.badRequest(
      'INVALID_TOPICS',
      'At least one topic must be specified'
    );
  }

  const totalQuestions = distribution.easy + distribution.medium + distribution.hard;

  if (totalQuestions === 0) {
    throw ApiError.badRequest(
      'INVALID_DISTRIBUTION',
      'Total number of questions must be greater than 0'
    );
  }

  // Fetch questions for each difficulty level
  const easyQuestions = await getActiveQuestionsByTopics(topicIds, 'easy');
  const mediumQuestions = await getActiveQuestionsByTopics(topicIds, 'medium');
  const hardQuestions = await getActiveQuestionsByTopics(topicIds, 'hard');

  // Check if we have any questions at all
  const totalAvailable = easyQuestions.length + mediumQuestions.length + hardQuestions.length;

  if (totalAvailable === 0) {
    throw ApiError.notFound(
      'NO_QUESTIONS',
      'No active questions found for the selected topics'
    );
  }

  // Select questions based on distribution
  // If not enough questions for a difficulty, take what's available
  const selectedEasy = selectRandomQuestions(easyQuestions, distribution.easy);
  const selectedMedium = selectRandomQuestions(mediumQuestions, distribution.medium);
  const selectedHard = selectRandomQuestions(hardQuestions, distribution.hard);

  // Combine all selected questions
  const allSelected = [...selectedEasy, ...selectedMedium, ...selectedHard];

  // Shuffle the final array to randomize order
  const shuffled = shuffleArray(allSelected);

  // Return only the question IDs
  return shuffled.map((q) => q.id);
}

/**
 * Get default difficulty distribution for a given number of questions
 * Distribution:
 * - 40% easy
 * - 40% medium
 * - 20% hard
 */
export function getDefaultDistribution(totalQuestions: number): DifficultyDistribution {
  const easy = Math.floor(totalQuestions * 0.4);
  const medium = Math.floor(totalQuestions * 0.4);
  const hard = totalQuestions - easy - medium; // Remainder goes to hard

  return { easy, medium, hard };
}
