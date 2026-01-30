import { CreateLobbyInput } from '../models/Lobby';
import { getTopicById } from '../models/Topic';

/**
 * Validate lobby creation settings
 * Checks topic IDs, question count, difficulty distribution, and max players
 */
export async function validateCreateLobbyInput(
  input: CreateLobbyInput
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Validate topicIds
  if (!input.topicIds || input.topicIds.length === 0) {
    errors.push('At least one topic must be selected');
  }

  // Validate UUID format for topicIds
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const topicId of input.topicIds || []) {
    if (!uuidRegex.test(topicId)) {
      errors.push(`Invalid topic ID format: ${topicId}`);
    }
  }

  // Validate that all topics exist
  if (input.topicIds && input.topicIds.length > 0) {
    for (const topicId of input.topicIds) {
      // Skip validation if ID format is invalid (already caught above)
      if (!uuidRegex.test(topicId)) {
        continue;
      }

      try {
        const topic = await getTopicById(topicId);
        if (!topic) {
          errors.push(`Topic with ID ${topicId} not found`);
        }
      } catch (error) {
        errors.push(`Failed to validate topic ${topicId}`);
      }
    }
  }

  // Validate questionCount
  if (
    input.questionCount === undefined ||
    input.questionCount === null ||
    input.questionCount < 5 ||
    input.questionCount > 50
  ) {
    errors.push('Question count must be between 5 and 50');
  }

  // Validate difficulty distribution
  if (!input.difficulty) {
    errors.push('Difficulty distribution is required');
  } else {
    const { easy, medium, hard } = input.difficulty;

    if (easy < 0 || medium < 0 || hard < 0) {
      errors.push('Difficulty counts cannot be negative');
    }

    const totalDifficulty = easy + medium + hard;
    if (totalDifficulty !== input.questionCount) {
      errors.push(
        `Difficulty distribution (${totalDifficulty}) must equal question count (${input.questionCount})`
      );
    }
  }

  // Validate maxPlayers
  if (
    input.maxPlayers === undefined ||
    input.maxPlayers === null ||
    input.maxPlayers < 2 ||
    input.maxPlayers > 10
  ) {
    errors.push('Max players must be between 2 and 10');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate lobby code format
 */
export function validateLobbyCode(code: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!code || code.trim().length === 0) {
    errors.push('Lobby code is required');
  } else if (code.length < 4 || code.length > 20) {
    errors.push('Lobby code must be between 4 and 20 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate ready status input
 */
export function validateReadyStatus(isReady: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof isReady !== 'boolean') {
    errors.push('isReady must be a boolean value');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
