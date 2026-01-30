import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { socketAuthMiddleware } from './middleware/auth';
import { handleLobbyJoin, handleLobbyReady } from './handlers/lobbyHandlers';
import { handleDisconnect } from './handlers/disconnectHandler';
import { socketStore } from './socketStore';

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  });

  // Middleware for authentication
  io.use(socketAuthMiddleware);

  // Register event handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, 'User:', socket.data.email);

    // Store user socket mapping
    socketStore.setUserSocket(socket.data.userId, socket.id);

    // Lobby events
    socket.on('lobby:join', (data) => handleLobbyJoin(io, socket, data));
    socket.on('lobby:ready', (data) => handleLobbyReady(io, socket, data));

    // Disconnect
    socket.on('disconnect', () => handleDisconnect(io, socket));
  });

  return io;
}