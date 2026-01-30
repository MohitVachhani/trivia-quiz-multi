import { redis } from '../config/redis';
import { findUserById } from '../models/User';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
}

/**
 * Get Redis key for game leaderboard
 */
function getLeaderboardKey(gameId: string): string {
  return `game:${gameId}:leaderboard`;
}

/**
 * Initialize leaderboard for a game with all players at score 0
 */
export async function initializeLeaderboard(
  gameId: string,
  playerIds: string[]
): Promise<void> {
  const key = getLeaderboardKey(gameId);

  // Add all players with initial score of 0
  const members = playerIds.flatMap((playerId) => [0, playerId]);

  if (members.length > 0) {
    await redis.zadd(key, ...members);
  }
}

/**
 * Update player score (adds points to existing score)
 */
export async function updatePlayerScore(
  gameId: string,
  userId: string,
  points: number
): Promise<void> {
  const key = getLeaderboardKey(gameId);
  await redis.zincrby(key, points, userId);
}

/**
 * Get leaderboard entries with player details
 */
export async function getLeaderboard(
  gameId: string,
  limit?: number
): Promise<LeaderboardEntry[]> {
  const key = getLeaderboardKey(gameId);

  // Get all players sorted by score (descending)
  const endIndex = limit ? limit - 1 : -1;
  const results = await redis.zrevrange(key, 0, endIndex, 'WITHSCORES');

  // Parse results (format: [playerId, score, playerId, score, ...])
  const leaderboard: LeaderboardEntry[] = [];

  for (let i = 0; i < results.length; i += 2) {
    const playerId = results[i];
    const score = parseInt(results[i + 1], 10);

    // Fetch player name (email)
    const user = await findUserById(playerId);
    const playerName = user ? user.email : 'Unknown Player';

    leaderboard.push({
      rank: Math.floor(i / 2) + 1,
      playerId,
      playerName,
      score,
    });
  }

  return leaderboard;
}

/**
 * Get player rank (1-indexed)
 */
export async function getPlayerRank(
  gameId: string,
  userId: string
): Promise<number> {
  const key = getLeaderboardKey(gameId);
  const rank = await redis.zrevrank(key, userId);

  // Redis returns 0-indexed rank, convert to 1-indexed
  // Returns null if player not found
  return rank !== null ? rank + 1 : -1;
}

/**
 * Get player score
 */
export async function getPlayerScore(
  gameId: string,
  userId: string
): Promise<number> {
  const key = getLeaderboardKey(gameId);
  const score = await redis.zscore(key, userId);

  return score ? parseInt(score, 10) : 0;
}

/**
 * Set leaderboard expiry (TTL in seconds)
 */
export async function setLeaderboardExpiry(
  gameId: string,
  ttl: number
): Promise<void> {
  const key = getLeaderboardKey(gameId);
  await redis.expire(key, ttl);
}
