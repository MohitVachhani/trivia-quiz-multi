import { findGameById, completeGame } from '../models/Game';
import { getAllPlayerProgress } from '../models/PlayerProgress';
import { updateLobbyStatus } from '../models/Lobby';
import { findUserById } from '../models/User';
import { pool } from '../config/database';
import { getLeaderboard, setLeaderboardExpiry } from './leaderboardService';

/**
 * Check if all players have completed all questions
 * If yes, mark game as completed and update stats
 */
export async function checkAndCompleteGame(gameId: string): Promise<boolean> {
  const game = await findGameById(gameId);
  if (!game) {
    return false;
  }

  // Get all player progress
  const allProgress = await getAllPlayerProgress(gameId);

  // Check if all players have completed all questions
  const allCompleted = allProgress.every(
    (progress) => progress.currentQuestionIndex >= game.totalQuestions
  );

  if (!allCompleted) {
    return false;
  }

  // Complete the game
  await completeGame(gameId);

  // Update lobby status
  await updateLobbyStatus(game.lobbyId, 'completed');

  // Update user stats
  await updateUserStatsAfterGame(gameId);

  // Set Redis leaderboard expiry to 24 hours (86400 seconds)
  await setLeaderboardExpiry(gameId, 86400);

  return true;
}

/**
 * Update user statistics after game completion
 */
export async function updateUserStatsAfterGame(gameId: string): Promise<void> {
  const game = await findGameById(gameId);
  if (!game) {
    return;
  }

  // Get final leaderboard
  const leaderboard = await getLeaderboard(gameId);

  // Update stats for each player
  for (const entry of leaderboard) {
    const user = await findUserById(entry.playerId);
    if (!user) {
      continue;
    }

    // Calculate new stats
    const newGamesPlayed = user.gamesPlayed + 1;
    const newVictories = entry.rank === 1 ? user.victories + 1 : user.victories;
    const newTotalPoints = user.totalPoints + entry.score;

    // Update user stats in database
    const query = `
      UPDATE trivia.users
      SET
        games_played = $1,
        victories = $2,
        total_points = $3,
        updated_at = NOW()
      WHERE id = $4
    `;

    await pool.query(query, [
      newGamesPlayed,
      newVictories,
      newTotalPoints,
      entry.playerId,
    ]);
  }
}
