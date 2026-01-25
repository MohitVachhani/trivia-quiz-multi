import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Lobby, GameState, GameResults } from '../types';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;

  // Lobby
  currentLobby: Lobby | null;
  setCurrentLobby: (lobby: Lobby | null) => void;
  updateLobbyPlayers: (players: Lobby['players']) => void;

  // Game
  currentGame: GameState | null;
  setCurrentGame: (game: GameState | null) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  setSelectedAnswer: (answerId: string | null) => void;
  setTimeRemaining: (time: number) => void;

  // Game Results
  gameResults: GameResults | null;
  setGameResults: (results: GameResults | null) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth state
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          currentLobby: null,
          currentGame: null,
          gameResults: null,
        }),

      // Lobby state
      currentLobby: null,
      setCurrentLobby: (lobby) => set({ currentLobby: lobby }),
      updateLobbyPlayers: (players) =>
        set((state) => ({
          currentLobby: state.currentLobby
            ? { ...state.currentLobby, players }
            : null,
        })),

      // Game state
      currentGame: null,
      setCurrentGame: (game) => set({ currentGame: game }),
      updateGameState: (updates) =>
        set((state) => ({
          currentGame: state.currentGame
            ? { ...state.currentGame, ...updates }
            : null,
        })),
      setSelectedAnswer: (answerId) =>
        set((state) => ({
          currentGame: state.currentGame
            ? { ...state.currentGame, selectedAnswer: answerId }
            : null,
        })),
      setTimeRemaining: (time) =>
        set((state) => ({
          currentGame: state.currentGame
            ? { ...state.currentGame, timeRemaining: time }
            : null,
        })),

      // Game Results state
      gameResults: null,
      setGameResults: (results) => set({ gameResults: results }),

      // UI state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
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
