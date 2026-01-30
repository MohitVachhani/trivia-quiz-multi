import { Server, Socket } from 'socket.io';
import { isPlayerInLobby, setPlayerReady, getPlayerReadyCount } from '../../models/LobbyPlayer';
import { getLobbyWithPlayers } from '../../services/lobbyService';

/**
 * Handle lobby:join event - Join lobby room
 */
export async function handleLobbyJoin(
  io: Server,
  socket: Socket,
  data: { lobbyId: string }
) {
  try {
    const { lobbyId } = data;
    const userId = socket.data.userId;

    // Validate user is in lobby
    const inLobby = await isPlayerInLobby(lobbyId, userId);
    if (!inLobby) {
      return socket.emit('error', { message: 'Not in lobby' });
    }

    // Join socket room
    socket.join(`lobby:${lobbyId}`);

    // Get updated lobby data
    const lobby = await getLobbyWithPlayers(lobbyId);

    // Notify all clients in lobby about the join
    io.to(`lobby:${lobbyId}`).emit('lobby:player_joined', {
      player: {
        id: userId,
        email: socket.data.email,
        isOwner: lobby.ownerId === userId,
        isReady: lobby.players.find((p: any) => p.id === userId)?.isReady || false
      },
      players: lobby.players
    });

    console.log(`User ${socket.data.email} joined lobby room ${lobbyId}`);
  } catch (error) {
    console.error('Error in handleLobbyJoin:', error);
    socket.emit('error', { message: 'Failed to join lobby' });
  }
}

/**
 * Handle lobby:ready event - Toggle ready status
 */
export async function handleLobbyReady(
  io: Server,
  socket: Socket,
  data: { lobbyId: string; isReady: boolean }
) {
  try {
    const { lobbyId, isReady } = data;
    const userId = socket.data.userId;

    // Validate user is in lobby
    const inLobby = await isPlayerInLobby(lobbyId, userId);
    if (!inLobby) {
      return socket.emit('error', { message: 'Not in lobby' });
    }

    // Update ready status
    await setPlayerReady(lobbyId, userId, isReady);

    // Get ready count and lobby data
    const lobby = await getLobbyWithPlayers(lobbyId);
    const readyCount = lobby.players.filter((p: any) => p.isReady && !p.isOwner).length;
    const totalPlayers = lobby.players.length;

    // Notify all clients
    io.to(`lobby:${lobbyId}`).emit('lobby:player_ready_changed', {
      playerId: userId,
      isReady,
      readyCount,
      totalPlayers,
      players: lobby.players
    });

    console.log(`User ${socket.data.email} set ready to ${isReady} in lobby ${lobbyId}`);
  } catch (error) {
    console.error('Error in handleLobbyReady:', error);
    socket.emit('error', { message: 'Failed to update ready status' });
  }
}

/**
 * Emit when game starts (called from game service)
 */
export function emitGameStarting(io: Server, lobbyId: string, gameId: string) {
  io.to(`lobby:${lobbyId}`).emit('lobby:game_starting', {
    gameId,
    countdown: 3 // seconds
  });
}

/**
 * Emit when player leaves (called from controller)
 */
export function emitPlayerLeft(io: Server, lobbyId: string, playerId: string, players: any[]) {
  io.to(`lobby:${lobbyId}`).emit('lobby:player_left', {
    playerId,
    players
  });
}