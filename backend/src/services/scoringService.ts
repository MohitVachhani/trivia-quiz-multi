export interface CalculateScoreInput {
  difficulty: 'easy' | 'medium' | 'hard';
  timeRemaining: number;
  timeLimit: number;
}

/**
 * Calculate score based on difficulty and time remaining
 *
 * Formula:
 * - basePoints = easy: 100, medium: 200, hard: 300
 * - timeBonus = (timeRemaining / timeLimit) * 100
 * - totalPoints = basePoints + timeBonus
 *
 * @param input - Score calculation parameters
 * @returns Rounded total points
 */
export function calculateScore(input: CalculateScoreInput): number {
  const { difficulty, timeRemaining, timeLimit } = input;

  // Calculate base points based on difficulty
  let basePoints: number;
  switch (difficulty) {
    case 'easy':
      basePoints = 100;
      break;
    case 'medium':
      basePoints = 200;
      break;
    case 'hard':
      basePoints = 300;
      break;
    default:
      basePoints = 100;
  }

  // Calculate time bonus
  const timeBonus = (timeRemaining / timeLimit) * 100;

  // Total points
  const totalPoints = basePoints + timeBonus;

  // Round to integer
  return Math.round(totalPoints);
}

/**
 * Validate if submitted answers match correct answers
 *
 * For single_correct: Arrays should match exactly (one element each)
 * For multi_correct: All correct answers must be selected, no extras
 * For true_false: Same as single_correct (one element each)
 *
 * @param submittedAnswerIds - Array of answer IDs submitted by player
 * @param correctAnswerIds - Array of correct answer IDs from question
 * @returns true if answer is correct, false otherwise
 */
export function validateAnswer(
  submittedAnswerIds: string[],
  correctAnswerIds: string[]
): boolean {
  // Check if arrays have same length
  if (submittedAnswerIds.length !== correctAnswerIds.length) {
    return false;
  }

  // Sort both arrays for comparison
  const sortedSubmitted = [...submittedAnswerIds].sort();
  const sortedCorrect = [...correctAnswerIds].sort();

  // Check if all elements match
  for (let i = 0; i < sortedSubmitted.length; i++) {
    if (sortedSubmitted[i] !== sortedCorrect[i]) {
      return false;
    }
  }

  return true;
}
