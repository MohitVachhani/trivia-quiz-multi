import {
  createGame,
  findGameById,
  Game,
  CreateGameInput,
} from '../models/Game';
import {
  createPlayerProgress,
  getPlayerProgress,
  addScore,
  incrementQuestionIndex,
} from '../models/PlayerProgress';
import {
  submitAnswer,
  hasAnswered,
  getCorrectAnswersCount,
  SubmitAnswerInput,
} from '../models/AnswerSubmission';
import { findLobbyById, setCurrentGameId, updateLobbyStatus } from '../models/Lobby';
import {
  getQuestionById,
  sanitizeQuestionForGame,
  GameQuestion,
} from '../models/Question';
import { selectQuestionsForGame } from './questionSelectionService';
import { calculateScore, validateAnswer } from './scoringService';
import {
  initializeLeaderboard,
  updatePlayerScore,
  getLeaderboard,
  getPlayerRank,
  LeaderboardEntry,
} from './leaderboardService';
import { checkAndCompleteGame } from './gameCompletionService';
import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';

// Default time limit per question (in seconds)
const DEFAULT_TIME_LIMIT = 30;

export interface GameState {
  game: Game;
  playerProgress: {
    id: string;
    gameId: string;
    userId: string;
    currentQuestionIndex: number;
    score: number;
    createdAt: Date;
    updatedAt: Date;
  };
  leaderboard: LeaderboardEntry[];
}

export interface GameResults {
  gameId: string;
  topicIds: string[];
  totalQuestions: number;
  completedAt: Date;
  winner: LeaderboardEntry;
  leaderboard: LeaderboardEntry[];
  yourPerformance?: {
    rank: number;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
  };
}

export interface AnswerResult {
  correct: boolean;
  correctAnswerIds: string[];
  pointsEarned: number;
  newScore: number;
  explanation: string | null;
}

export interface CurrentQuestionResponse {
  question: GameQuestion;
  questionNumber: number;
  totalQuestions: number;
}

/**
 * Create a new game from a lobby
 */
export async function createGameFromLobby(lobbyId: string): Promise<Game> {
  // Get lobby details
  const lobby = await findLobbyById(lobbyId);
  if (!lobby) {
    throw ApiError.notFound('LOBBY_NOT_FOUND', 'Lobby not found');
  }

  if (lobby.status !== 'waiting') {
    throw ApiError.badRequest(
      'LOBBY_NOT_WAITING',
      'Lobby is not in waiting state'
    );
  }

  // Select questions based on lobby settings
  const questionIds = await selectQuestionsForGame({
    topicIds: lobby.topicIds,
    distribution: lobby.difficulty,
  });

  // Create game record
  const gameInput: CreateGameInput = {
    lobbyId: lobby.id,
    topicIds: lobby.topicIds,
    playerIds: lobby.playerIds,
    questionIds,
    totalQuestions: questionIds.length,
  };

  const game = await createGame(gameInput);

  // Create player progress for each player
  for (const playerId of lobby.playerIds) {
    await createPlayerProgress(game.id, playerId);
  }

  // Update lobby with gameId and status 'in_progress'
  await setCurrentGameId(lobby.id, game.id);
  await updateLobbyStatus(lobby.id, 'in_progress');

  // Initialize Redis leaderboard
  await initializeLeaderboard(game.id, lobby.playerIds);

  return game;
}

/**
 * Get current question for a player
 */
export async function getCurrentQuestion(
  gameId: string,
  userId: string
): Promise<CurrentQuestionResponse> {
  // Get player progress
  const progress = await getPlayerProgress(gameId, userId);
  if (!progress) {
    throw ApiError.notFound(
      'PROGRESS_NOT_FOUND',
      'Player progress not found for this game'
    );
  }

  // Get game
  const game = await findGameById(gameId);
  if (!game) {
    throw ApiError.notFound('GAME_NOT_FOUND', 'Game not found');
  }

  // Check if player has completed all questions
  if (progress.currentQuestionIndex >= game.questionIds.length) {
    throw ApiError.badRequest(
      'ALL_QUESTIONS_COMPLETED',
      'You have completed all questions'
    );
  }

  // Get question at currentQuestionIndex
  const questionId = game.questionIds[progress.currentQuestionIndex];
  const question = await getQuestionById(questionId);

  if (!question) {
    throw ApiError.notFound('QUESTION_NOT_FOUND', 'Question not found');
  }

  // Return question WITHOUT correctAnswerIds (prevent cheating)
  const gameQuestion = sanitizeQuestionForGame(question);

  return {
    question: gameQuestion,
    questionNumber: progress.currentQuestionIndex + 1,
    totalQuestions: game.totalQuestions,
  };
}

/**
 * Process answer submission
 */
export async function processAnswerSubmission(
  input: SubmitAnswerInput
): Promise<AnswerResult> {
  const { gameId, userId, questionId, answerIds, timeRemaining } = input;

  // Validate game is in progress
  const game = await findGameById(gameId);
  if (!game) {
    throw ApiError.notFound('GAME_NOT_FOUND', 'Game not found');
  }

  if (game.status !== 'in_progress') {
    throw ApiError.badRequest('GAME_NOT_IN_PROGRESS', 'Game is not in progress');
  }

  // Validate player is in game
  if (!game.playerIds.includes(userId)) {
    throw ApiError.forbidden('NOT_IN_GAME', 'You are not a player in this game');
  }

  // Validate question belongs to game
  if (!game.questionIds.includes(questionId)) {
    throw ApiError.badRequest(
      'INVALID_QUESTION',
      'Question does not belong to this game'
    );
  }

  // Check if already answered
  const alreadyAnswered = await hasAnswered(gameId, userId, questionId);
  if (alreadyAnswered) {
    throw ApiError.badRequest(
      'ALREADY_ANSWERED',
      'You have already answered this question'
    );
  }

  // Get question and validate answer
  const question = await getQuestionById(questionId);
  if (!question) {
    throw ApiError.notFound('QUESTION_NOT_FOUND', 'Question not found');
  }

  const isCorrect = validateAnswer(answerIds, question.correctAnswerIds);

  // Calculate score
  let points = 0;
  if (isCorrect) {
    points = calculateScore({
      difficulty: question.difficulty,
      timeRemaining,
      timeLimit: DEFAULT_TIME_LIMIT,
    });
  }

  // Save answer submission
  await submitAnswer(input, isCorrect, points);

  // Update player progress (score and index)
  if (isCorrect) {
    await addScore(gameId, userId, points);
  }
  await incrementQuestionIndex(gameId, userId);

  // Update Redis leaderboard
  if (isCorrect) {
    await updatePlayerScore(gameId, userId, points);
  }

  // Update question statistics
  await pool.query(
    `
    UPDATE trivia.questions
    SET
      times_asked = times_asked + 1,
      times_correct = times_correct + $1,
      updated_at = NOW()
    WHERE id = $2
  `,
    [isCorrect ? 1 : 0, questionId]
  );

  // Get updated progress to get new score
  const updatedProgress = await getPlayerProgress(gameId, userId);
  const newScore = updatedProgress?.score || 0;

  // Check if player completed all questions
  // Check if all players completed (end game)
  await checkAndCompleteGame(gameId);

  return {
    correct: isCorrect,
    correctAnswerIds: question.correctAnswerIds,
    pointsEarned: points,
    newScore,
    explanation: question.explanation,
  };
}

/**
 * Get game state for a player
 */
export async function getGameState(
  gameId: string,
  userId: string
): Promise<GameState> {
  const game = await findGameById(gameId);
  if (!game) {
    throw ApiError.notFound('GAME_NOT_FOUND', 'Game not found');
  }

  // Validate user is in game
  if (!game.playerIds.includes(userId)) {
    throw ApiError.forbidden('NOT_IN_GAME', 'You are not a player in this game');
  }

  const progress = await getPlayerProgress(gameId, userId);
  if (!progress) {
    throw ApiError.notFound(
      'PROGRESS_NOT_FOUND',
      'Player progress not found for this game'
    );
  }

  const leaderboard = await getLeaderboard(gameId);

  return {
    game,
    playerProgress: progress,
    leaderboard,
  };
}

/**
 * Get final game results
 */
export async function getGameResults(
  gameId: string,
  userId?: string
): Promise<GameResults> {
  const game = await findGameById(gameId);
  if (!game) {
    throw ApiError.notFound('GAME_NOT_FOUND', 'Game not found');
  }

  if (game.status !== 'completed') {
    throw ApiError.badRequest('GAME_NOT_COMPLETED', 'Game is not yet completed');
  }

  // Get final leaderboard
  const leaderboard = await getLeaderboard(gameId);

  if (leaderboard.length === 0) {
    throw ApiError.notFound('NO_RESULTS', 'No results found for this game');
  }

  const winner = leaderboard[0];

  const results: GameResults = {
    gameId: game.id,
    topicIds: game.topicIds,
    totalQuestions: game.totalQuestions,
    completedAt: game.completedAt!,
    winner,
    leaderboard,
  };

  // If userId provided, add their performance
  if (userId) {
    // Validate user was in game
    if (!game.playerIds.includes(userId)) {
      throw ApiError.forbidden('NOT_IN_GAME', 'You were not a player in this game');
    }

    const rank = await getPlayerRank(gameId, userId);
    const progress = await getPlayerProgress(gameId, userId);
    const correctAnswers = await getCorrectAnswersCount(gameId, userId);

    results.yourPerformance = {
      rank,
      score: progress?.score || 0,
      correctAnswers,
      totalQuestions: game.totalQuestions,
    };
  }

  return results;
}
