import { Request, Response, NextFunction } from 'express';
import {
  getGameState as getGameStateService,
  getCurrentQuestion as getCurrentQuestionService,
  processAnswerSubmission,
  getGameResults as getGameResultsService,
} from '../services/gameService';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/apiResponse';

/**
 * GET /api/game/:gameId
 * Get game state (game, player progress, leaderboard)
 */
export async function getGameState(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { gameId } = req.params;
    const { userId } = req.user!;

    if (!gameId) {
      throw ApiError.badRequest('MISSING_GAME_ID', 'Game ID is required');
    }

    const gameState = await getGameStateService(gameId, userId);

    sendSuccess(res, { gameState });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/game/:gameId/question/current
 * Get current question for the authenticated player
 */
export async function getCurrentQuestion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { gameId } = req.params;
    const { userId } = req.user!;

    if (!gameId) {
      throw ApiError.badRequest('MISSING_GAME_ID', 'Game ID is required');
    }

    const questionData = await getCurrentQuestionService(gameId, userId);

    sendSuccess(res, questionData);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/game/:gameId/answer
 * Submit answer for current question
 */
export async function submitAnswer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { gameId } = req.params;
    const { userId } = req.user!;
    const { questionId, answerIds, timeRemaining } = req.body;

    // Validate input
    if (!gameId) {
      throw ApiError.badRequest('MISSING_GAME_ID', 'Game ID is required');
    }

    if (!questionId) {
      throw ApiError.badRequest('MISSING_QUESTION_ID', 'Question ID is required');
    }

    if (!answerIds || !Array.isArray(answerIds) || answerIds.length === 0) {
      throw ApiError.badRequest(
        'INVALID_ANSWER_IDS',
        'Answer IDs must be a non-empty array'
      );
    }

    if (typeof timeRemaining !== 'number' || timeRemaining < 0) {
      throw ApiError.badRequest(
        'INVALID_TIME_REMAINING',
        'Time remaining must be a non-negative number'
      );
    }

    const result = await processAnswerSubmission({
      gameId,
      userId,
      questionId,
      answerIds,
      timeRemaining,
    });

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/game/:gameId/results
 * Get final game results with leaderboard
 */
export async function getGameResults(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { gameId } = req.params;
    const { userId } = req.user!;

    if (!gameId) {
      throw ApiError.badRequest('MISSING_GAME_ID', 'Game ID is required');
    }

    const results = await getGameResultsService(gameId, userId);

    sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
}
