import { Server, Socket } from 'socket.io';
import { socketStore } from '../socketStore';
import { emitPlayerDisconnected } from './gameHandlers';

/**
 * Handle client disconnect
 */
export async function handleDisconnect(io: Server, socket: Socket) {
  try {
    const userId = socket.data.userId;
    const email = socket.data.email;

    if (!userId) {
      console.log('Client disconnected (no user data):', socket.id);
      return;
    }

    // Remove from socket store
    socketStore.removeUserSocket(userId);

    // For now, we'll just log the disconnect
    // In a future enhancement, we could:
    // 1. Find active games for user
    // 2. Notify other players in those games
    console.log(`Client disconnected: ${email} (${socket.id})`);

    // Example of what could be added later:
    // const activeGames = await findActiveGamesForUser(userId);
    // for (const game of activeGames) {
    //   emitPlayerDisconnected(io, game.id, userId, email);
    // }

  } catch (error) {
    console.error('Error in handleDisconnect:', error);
  }
}