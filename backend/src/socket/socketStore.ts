import { Server, Socket } from 'socket.io';

class SocketStore {
  private userSocketMap: Map<string, string> = new Map();

  setUserSocket(userId: string, socketId: string) {
    this.userSocketMap.set(userId, socketId);
  }

  getUserSocket(userId: string): string | undefined {
    return this.userSocketMap.get(userId);
  }

  removeUserSocket(userId: string) {
    this.userSocketMap.delete(userId);
  }

  findSocketByUserId(io: Server, userId: string): Socket | undefined {
    const socketId = this.getUserSocket(userId);
    return socketId ? io.sockets.sockets.get(socketId) : undefined;
  }
}

export const socketStore = new SocketStore();