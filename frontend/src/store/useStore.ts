import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Lobby, GameState, GameResults, Question } from '../types';
import { socketService } from '../services/socket';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  initializeSocket: () => Promise<void>;

  // Lobby
  currentLobby: Lobby | null;
  setCurrentLobby: (lobby: Lobby | null) => void;
  updateLobbyPlayers: (players: Lobby['players']) => void;
  updatePlayerReady: (playerId: string, isReady: boolean) => void;

  // Game
  currentGame: GameState | null;
  setCurrentGame: (game: GameState | null) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  setCurrentQuestion: (question: Question | null, questionNumber?: number, totalQuestions?: number) => void;
  setSelectedAnswers: (answerIds: string[]) => void;
  setTimeRemaining: (time: number) => void;
  setHasAnswered: (hasAnswered: boolean) => void;
  updateLeaderboard: (leaderboard: GameState['leaderboard']) => void;

  // Game Results
  gameResults: GameResults | null;
  setGameResults: (results: GameResults | null) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Socket connection state
  isSocketConnected: boolean;
  setSocketConnected: (connected: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => {
        socketService.disconnect();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          currentLobby: null,
          currentGame: null,
          gameResults: null,
          isSocketConnected: false,
        });
      },
      initializeSocket: async () => {
        const { token } = get();
        if (token && !socketService.isConnected()) {
          try {
            await socketService.connect(token);
            set({ isSocketConnected: true });
          } catch (error) {
            console.error('Failed to connect socket:', error);
            set({ isSocketConnected: false });
          }
        }
      },

      // Lobby state
      currentLobby: null,
      setCurrentLobby: (lobby) => set({ currentLobby: lobby }),
      updateLobbyPlayers: (players) =>
        set((state) => ({
          currentLobby: state.currentLobby
            ? { ...state.currentLobby, players }
            : null,
        })),
      updatePlayerReady: (playerId, isReady) =>
        set((state) => {
          if (!state.currentLobby) return state;
          
          const updatedPlayers = state.currentLobby.players.map(player =>
            player.id === playerId ? { ...player, isReady } : player
          );
          
          return {
            currentLobby: {
              ...state.currentLobby,
              players: updatedPlayers,
            },
          };
        }),

      // Game state
      currentGame: null,
      setCurrentGame: (game) => set({ currentGame: game }),
      updateGameState: (updates) =>
        set((state) => ({
          currentGame: state.currentGame
            ? { ...state.currentGame, ...updates }
            : null,
        })),
      setCurrentQuestion: (question, questionNumber, totalQuestions) =>
        set((state) => ({
          currentGame: state.currentGame
            ? {
                ...state.currentGame,
                currentQuestion: question ? {
                  ...question,
                  questionNumber: questionNumber || state.currentGame.currentQuestionIndex + 1,
                  totalQuestions: totalQuestions || state.currentGame.totalQuestions,
                } : null,
                selectedAnswers: [],
                hasAnswered: false,
              }
            : null,
        })),
      setSelectedAnswers: (answerIds) =>
        set((state) => ({
          currentGame: state.currentGame
            ? { ...state.currentGame, selectedAnswers: answerIds }
            : null,
        })),
      setTimeRemaining: (time) =>
        set((state) => ({
          currentGame: state.currentGame
            ? { ...state.currentGame, timeRemaining: time }
            : null,
        })),
      setHasAnswered: (hasAnswered) =>
        set((state) => ({
          currentGame: state.currentGame
            ? { ...state.currentGame, hasAnswered }
            : null,
        })),
      updateLeaderboard: (leaderboard) =>
        set((state) => ({
          currentGame: state.currentGame
            ? { ...state.currentGame, leaderboard }
            : null,
        })),

      // Game Results state
      gameResults: null,
      setGameResults: (results) => set({ gameResults: results }),

      // UI state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      error: null,
      setError: (error) => set({ error }),

      // Socket state
      isSocketConnected: false,
      setSocketConnected: (connected) => set({ isSocketConnected: connected }),
    }),
    {
      name: 'trivia-quest-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
