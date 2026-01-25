// User Types
export interface User {
  id: string;
  email: string;
  stats: UserStats;
}

export interface UserStats {
  gamesPlayed: number;
  victories: number;
  timePlayed: string;
  totalPoints?: number;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Lobby Types
export interface Lobby {
  id: string;
  code: string;
  ownerId: string;
  settings: GameSettings;
  players: Player[];
  status: 'waiting' | 'starting' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface GameSettings {
  topic: string;
  questionCount: number;
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface Player {
  id: string;
  email: string;
  isOwner: boolean;
  isReady: boolean;
}

// Quiz/Game Types
export interface Question {
  id: string;
  questionNumber: number;
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: QuestionOption[];
  timeLimit: number;
}

export interface QuestionOption {
  id: string;
  label: string;
  text: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  correctAnswers?: number;
}

export interface GameState {
  id: string;
  lobbyId: string;
  topic: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: 'waiting' | 'in_progress' | 'completed';
  currentQuestion: Question | null;
  leaderboard: LeaderboardEntry[];
  timeRemaining: number;
  selectedAnswer: string | null;
  hasAnswered: boolean;
}

export interface GameResults {
  gameId: string;
  topic: string;
  totalQuestions: number;
  winner: {
    playerId: string;
    playerName: string;
    score: number;
  };
  leaderboard: LeaderboardEntry[];
  yourPerformance: {
    rank: number;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
