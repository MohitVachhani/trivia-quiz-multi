import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

// Socket Event Types
export interface LobbyEvents {
  'lobby:join': { lobbyId: string };
  'lobby:ready': { lobbyId: string; isReady: boolean };
}

export interface LobbyListeners {
  'lobby:player_joined': (data: { player: any; players: any[] }) => void;
  'lobby:player_ready_changed': (data: { playerId: string; isReady: boolean; readyCount: number; totalPlayers: number }) => void;
  'lobby:game_starting': (data: { gameId: string; countdown: number }) => void;
  'lobby:player_left': (data: { playerId: string; players: any[] }) => void;
}

export interface GameListeners {
  'game:started': (data: { gameId: string; totalQuestions: number }) => void;
  'game:new_question': (data: { question: any }) => void;
  'game:player_answered': (data: { playerId: string; playerName: string; answeredCount: number; totalPlayers: number }) => void;
  'game:question_results': (data: { correctAnswerIds: string[]; explanation: string; pointsEarned: number; newScore: number }) => void;
  'game:leaderboard_update': (data: { leaderboard: any[] }) => void;
  'game:over': (data: { gameId: string; winner: any; finalLeaderboard: any[] }) => void;
  'game:player_disconnected': (data: { playerId: string; playerName: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  connect(token: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.connected = true;
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.connected = false;
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('Socket disconnected');
    }
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Lobby Events
  joinLobby(lobbyId: string): void {
    if (this.socket) {
      this.socket.emit('lobby:join', { lobbyId });
    }
  }

  setLobbyReady(lobbyId: string, isReady: boolean): void {
    if (this.socket) {
      this.socket.emit('lobby:ready', { lobbyId, isReady });
    }
  }

  // Event Listeners
  onLobbyPlayerJoined(callback: LobbyListeners['lobby:player_joined']): void {
    this.socket?.on('lobby:player_joined', callback);
  }

  onLobbyPlayerReadyChanged(callback: LobbyListeners['lobby:player_ready_changed']): void {
    this.socket?.on('lobby:player_ready_changed', callback);
  }

  onLobbyGameStarting(callback: LobbyListeners['lobby:game_starting']): void {
    this.socket?.on('lobby:game_starting', callback);
  }

  onLobbyPlayerLeft(callback: LobbyListeners['lobby:player_left']): void {
    this.socket?.on('lobby:player_left', callback);
  }

  onGameStarted(callback: GameListeners['game:started']): void {
    this.socket?.on('game:started', callback);
  }

  onNewQuestion(callback: GameListeners['game:new_question']): void {
    this.socket?.on('game:new_question', callback);
  }

  onPlayerAnswered(callback: GameListeners['game:player_answered']): void {
    this.socket?.on('game:player_answered', callback);
  }

  onQuestionResults(callback: GameListeners['game:question_results']): void {
    this.socket?.on('game:question_results', callback);
  }

  onLeaderboardUpdate(callback: GameListeners['game:leaderboard_update']): void {
    this.socket?.on('game:leaderboard_update', callback);
  }

  onGameOver(callback: GameListeners['game:over']): void {
    this.socket?.on('game:over', callback);
  }

  onPlayerDisconnected(callback: GameListeners['game:player_disconnected']): void {
    this.socket?.on('game:player_disconnected', callback);
  }

  // Remove Event Listeners
  offLobbyPlayerJoined(callback?: LobbyListeners['lobby:player_joined']): void {
    this.socket?.off('lobby:player_joined', callback);
  }

  offLobbyPlayerReadyChanged(callback?: LobbyListeners['lobby:player_ready_changed']): void {
    this.socket?.off('lobby:player_ready_changed', callback);
  }

  offLobbyGameStarting(callback?: LobbyListeners['lobby:game_starting']): void {
    this.socket?.off('lobby:game_starting', callback);
  }

  offLobbyPlayerLeft(callback?: LobbyListeners['lobby:player_left']): void {
    this.socket?.off('lobby:player_left', callback);
  }

  offGameStarted(callback?: GameListeners['game:started']): void {
    this.socket?.off('game:started', callback);
  }

  offNewQuestion(callback?: GameListeners['game:new_question']): void {
    this.socket?.off('game:new_question', callback);
  }

  offPlayerAnswered(callback?: GameListeners['game:player_answered']): void {
    this.socket?.off('game:player_answered', callback);
  }

  offQuestionResults(callback?: GameListeners['game:question_results']): void {
    this.socket?.off('game:question_results', callback);
  }

  offLeaderboardUpdate(callback?: GameListeners['game:leaderboard_update']): void {
    this.socket?.off('game:leaderboard_update', callback);
  }

  offGameOver(callback?: GameListeners['game:over']): void {
    this.socket?.off('game:over', callback);
  }

  offPlayerDisconnected(callback?: GameListeners['game:player_disconnected']): void {
    this.socket?.off('game:player_disconnected', callback);
  }

  // Remove all listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();

export default socketService;