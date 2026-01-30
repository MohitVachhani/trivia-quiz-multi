import { pool } from '../config/database';

/**
 * Cleanup expired lobbies
 * This job should be run periodically (e.g., every 5 minutes) to:
 * 1. Archive lobbies that have expired (expires_at < NOW())
 * 2. Delete very old archived lobbies (optional, for data retention)
 */
export async function cleanupExpiredLobbies(): Promise<{
  archivedCount: number;
}> {
  console.log('[Lobby Cleanup] Starting cleanup job...');

  try {
    // Archive expired waiting lobbies
    const archiveQuery = `
      UPDATE trivia.lobbies
      SET archived_at = NOW(),
          status = 'completed'
      WHERE expires_at < NOW()
        AND status = 'waiting'
        AND archived_at IS NULL
      RETURNING id
    `;

    const archiveResult = await pool.query(archiveQuery);
    const archivedCount = archiveResult.rowCount || 0;

    console.log(`[Lobby Cleanup] Archived ${archivedCount} expired lobbies`);

    return {
      archivedCount,
    };
  } catch (error) {
    console.error('[Lobby Cleanup] Error during cleanup:', error);
    throw error;
  }
}

/**
 * Setup periodic cleanup job
 * Run the cleanup job every 5 minutes
 */
export function startLobbyCleanupJob(intervalMinutes: number = 5): NodeJS.Timeout {
  console.log(
    `[Lobby Cleanup] Starting periodic cleanup job (interval: ${intervalMinutes} minutes)`
  );

  // Run immediately on start
  cleanupExpiredLobbies().catch((error) => {
    console.error('[Lobby Cleanup] Initial cleanup failed:', error);
  });

  // Then run periodically
  const intervalMs = intervalMinutes * 60 * 1000;
  const interval = setInterval(() => {
    cleanupExpiredLobbies().catch((error) => {
      console.error('[Lobby Cleanup] Periodic cleanup failed:', error);
    });
  }, intervalMs);

  return interval;
}

/**
 * Stop the cleanup job
 */
export function stopLobbyCleanupJob(interval: NodeJS.Timeout): void {
  console.log('[Lobby Cleanup] Stopping cleanup job');
  clearInterval(interval);
}

/**
 * Optional: Delete very old archived lobbies for data retention
 * This can be called manually or scheduled separately
 */
export async function deleteOldArchivedLobbies(
  daysOld: number = 30
): Promise<{ deletedCount: number }> {
  console.log(
    `[Lobby Cleanup] Deleting archived lobbies older than ${daysOld} days`
  );

  try {
    const deleteQuery = `
      DELETE FROM trivia.lobbies
      WHERE archived_at < NOW() - INTERVAL '${daysOld} days'
        AND archived_at IS NOT NULL
      RETURNING id
    `;

    const deleteResult = await pool.query(deleteQuery);
    const deletedCount = deleteResult.rowCount || 0;

    console.log(`[Lobby Cleanup] Deleted ${deletedCount} old archived lobbies`);

    return {
      deletedCount,
    };
  } catch (error) {
    console.error('[Lobby Cleanup] Error deleting old lobbies:', error);
    throw error;
  }
}
