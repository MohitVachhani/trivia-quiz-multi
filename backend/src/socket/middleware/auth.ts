import { Socket } from 'socket.io';
import { verifyToken } from '../../services/authService';

export async function socketAuthMiddleware(socket: Socket, next: Function) {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    socket.data.userId = payload.userId;
    socket.data.email = payload.email;

    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
}