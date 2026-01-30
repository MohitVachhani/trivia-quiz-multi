import axios, { type AxiosInstance, type AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trivia-quest-storage');
    if (token) {
      try {
        const parsed = JSON.parse(token);
        if (parsed.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`;
        }
      } catch (error) {
        console.error('Error parsing stored token:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem('trivia-quest-storage');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    stats: {
      gamesPlayed: number;
      victories: number;
      timePlayed: string;
      totalPoints?: number;
    };
  };
  token: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  questionsCount: number;
}

export interface LobbyCreateRequest {
  topicIds: string[];
  questionCount: number;
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  maxPlayers: number;
}

export interface LobbyResponse {
  id: string;
  code: string;
  ownerId: string;
  topicIds: string[];
  playerIds: string[];
  status: 'waiting' | 'starting' | 'in_progress' | 'completed';
  maxPlayers: number;
  questionCount: number;
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  createdAt: string;
  expiresAt: string;
  players: Array<{
    id: string;
    email: string;
    isOwner: boolean;
    isReady: boolean;
  }>;
}

export interface GameResponse {
  id: string;
  lobbyId: string;
  status: 'waiting' | 'in_progress' | 'completed';
  currentQuestionIndex: number;
  totalQuestions: number;
  players: Array<{
    id: string;
    email: string;
    score: number;
    progress: number;
  }>;
}

export interface QuestionResponse {
  id: string;
  type: 'single_correct' | 'multi_correct' | 'true_false';
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: Array<{
    id: string;
    label: string;
    text: string;
  }>;
  timeLimit: number;
}

export interface GameResultsResponse {
  gameId: string;
  status: 'completed';
  finalLeaderboard: Array<{
    rank: number;
    playerId: string;
    playerName: string;
    score: number;
    correctAnswers: number;
  }>;
  winner: {
    playerId: string;
    playerName: string;
    score: number;
  };
}

// API Functions
export const authAPI = {
  signup: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', {
      email,
      password,
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Signup failed');
    }
    
    return response.data.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Login failed');
    }
    
    return response.data.data;
  },

  getMe: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get<ApiResponse<{ user: AuthResponse['user'] }>>('/auth/me');
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get user data');
    }
    
    return response.data.data.user;
  },
};

export const topicsAPI = {
  getTopics: async (): Promise<Topic[]> => {
    const response = await apiClient.get<ApiResponse<Topic[]>>('/quiz/topics');
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch topics');
    }
    
    return response.data.data;
  },
};

export const lobbyAPI = {
  create: async (lobbyData: LobbyCreateRequest): Promise<LobbyResponse> => {
    const response = await apiClient.post<ApiResponse<{ lobby: LobbyResponse }>>('/lobby/create', lobbyData);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create lobby');
    }
    
    return response.data.data.lobby;
  },

  join: async (code: string): Promise<LobbyResponse> => {
    const response = await apiClient.post<ApiResponse<{ lobby: LobbyResponse }>>('/lobby/join', { code });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to join lobby');
    }
    
    return response.data.data.lobby;
  },

  getLobby: async (lobbyId: string): Promise<LobbyResponse> => {
    const response = await apiClient.get<ApiResponse<{ lobby: LobbyResponse }>>(`/lobby/${lobbyId}`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get lobby');
    }
    
    return response.data.data.lobby;
  },

  setReady: async (lobbyId: string, isReady: boolean): Promise<void> => {
    const response = await apiClient.patch<ApiResponse>(`/lobby/${lobbyId}/ready`, { isReady });
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to update ready status');
    }
  },

  leave: async (lobbyId: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse>(`/lobby/${lobbyId}/leave`);
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to leave lobby');
    }
  },

  start: async (lobbyId: string): Promise<{ gameId: string }> => {
    const response = await apiClient.post<ApiResponse<{ gameId: string }>>(`/lobby/${lobbyId}/start`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to start game');
    }
    
    return response.data.data;
  },
};

export const gameAPI = {
  getGame: async (gameId: string): Promise<GameResponse> => {
    const response = await apiClient.get<ApiResponse<GameResponse>>(`/game/${gameId}`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get game');
    }
    
    return response.data.data;
  },

  getCurrentQuestion: async (gameId: string): Promise<QuestionResponse> => {
    const response = await apiClient.get<ApiResponse<QuestionResponse>>(`/game/${gameId}/question/current`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get current question');
    }
    
    return response.data.data;
  },

  submitAnswer: async (gameId: string, questionId: string, answerIds: string[], timeRemaining: number): Promise<void> => {
    const response = await apiClient.post<ApiResponse>(`/game/${gameId}/answer`, {
      questionId,
      answerIds,
      timeRemaining,
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to submit answer');
    }
  },

  getResults: async (gameId: string): Promise<GameResultsResponse> => {
    const response = await apiClient.get<ApiResponse<GameResultsResponse>>(`/game/${gameId}/results`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to get game results');
    }
    
    return response.data.data;
  },
};

export default apiClient;