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

// Topic Types
export interface Topic {
  id: string;
  name: string;
  description: string;
  questionsCount: number;
}

// Lobby Types
export interface Lobby {
  id: string;
  code: string;
  ownerId: string;
  topicIds: string[];
  playerIds: string[];
  settings: GameSettings;
  players: Player[];
  status: 'waiting' | 'starting' | 'in_progress' | 'completed';
  maxPlayers: number;
  questionCount: number;
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  createdAt: string;
  expiresAt?: string;
}

export interface GameSettings {
  topicIds: string[];
  questionCount: number;
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  maxPlayers: number;
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
  type: 'single_correct' | 'multi_correct' | 'true_false';
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: QuestionOption[];
  timeLimit: number;
  questionNumber?: number;
  totalQuestions?: number;
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
  status: 'waiting' | 'in_progress' | 'completed';
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: Question | null;
  leaderboard: LeaderboardEntry[];
  timeRemaining: number;
  selectedAnswer: string | string[] | null;
  selectedAnswers: string[];
  hasAnswered: boolean;
  players: Array<{
    id: string;
    email: string;
    score: number;
    progress: number;
  }>;
}

export interface GameResults {
  gameId: string;
  status: 'completed';
  totalQuestions: number;
  winner: {
    playerId: string;
    playerName: string;
    score: number;
  };
  finalLeaderboard: LeaderboardEntry[];
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
