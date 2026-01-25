# Trivia Quest - Backend API Specification

## Overview
This document outlines the complete backend API specification for the Trivia Quest multiplayer trivia application, including REST endpoints, WebSocket events, and data models.

## Technology Stack
- **Node.js + Express** - REST API server
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Authentication tokens
- **PostgreSQL/MongoDB** - Database (recommended: PostgreSQL)
- **Redis** - Session management and real-time game state (optional but recommended)

---

## 1. Authentication Endpoints

### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "createdAt": "2024-01-25T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email already registered"
  }
}
```

---

### POST `/api/auth/login`
Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "stats": {
        "gamesPlayed": 247,
        "victories": 156,
        "timePlayed": "12h"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### GET `/api/auth/me`
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "stats": {
        "gamesPlayed": 247,
        "victories": 156,
        "timePlayed": "12h",
        "totalPoints": 45600
      }
    }
  }
}
```

---

## 2. Game Lobby Endpoints

### POST `/api/lobby/create`
Create a new game lobby.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "settings": {
    "topic": "The Office",
    "questionCount": 10,
    "difficulty": {
      "easy": 4,
      "medium": 4,
      "hard": 2
    }
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "lobby": {
      "id": "lobby_abc123",
      "code": "TRIVIA-2024",
      "ownerId": "user_123",
      "settings": {
        "topic": "The Office",
        "questionCount": 10,
        "difficulty": {
          "easy": 4,
          "medium": 4,
          "hard": 2
        }
      },
      "players": [
        {
          "id": "user_123",
          "email": "user@example.com",
          "isOwner": true,
          "isReady": false
        }
      ],
      "status": "waiting",
      "createdAt": "2024-01-25T10:30:00Z"
    }
  }
}
```

---

### POST `/api/lobby/join`
Join an existing lobby using invite code.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "code": "TRIVIA-2024"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "lobby": {
      "id": "lobby_abc123",
      "code": "TRIVIA-2024",
      "ownerId": "user_456",
      "settings": {
        "topic": "The Office",
        "questionCount": 10,
        "difficulty": {
          "easy": 4,
          "medium": 4,
          "hard": 2
        }
      },
      "players": [
        {
          "id": "user_456",
          "email": "owner@example.com",
          "isOwner": true,
          "isReady": true
        },
        {
          "id": "user_123",
          "email": "user@example.com",
          "isOwner": false,
          "isReady": false
        }
      ],
      "status": "waiting"
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "LOBBY_NOT_FOUND",
    "message": "Invalid invite code"
  }
}
```

---

### GET `/api/lobby/:lobbyId`
Get lobby details.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "lobby": {
      "id": "lobby_abc123",
      "code": "TRIVIA-2024",
      "ownerId": "user_456",
      "settings": {
        "topic": "The Office",
        "questionCount": 10,
        "difficulty": {
          "easy": 4,
          "medium": 4,
          "hard": 2
        }
      },
      "players": [...],
      "status": "waiting"
    }
  }
}
```

---

### PATCH `/api/lobby/:lobbyId/ready`
Toggle player ready status.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "isReady": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isReady": true
  }
}
```

---

### POST `/api/lobby/:lobbyId/start`
Start the game (owner only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "gameId": "game_xyz789",
    "message": "Game started"
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_OWNER",
    "message": "Only lobby owner can start the game"
  }
}
```

---

### DELETE `/api/lobby/:lobbyId/leave`
Leave a lobby.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Left lobby successfully"
}
```

---

## 3. Quiz/Game Endpoints

### GET `/api/quiz/topics`
Get available quiz topics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "the_office",
        "name": "The Office",
        "description": "Questions about the hit TV series The Office",
        "questionCount": 500,
        "isAvailable": true
      },
      {
        "id": "friends",
        "name": "Friends",
        "description": "Coming soon",
        "questionCount": 0,
        "isAvailable": false
      }
    ]
  }
}
```

---

### GET `/api/game/:gameId`
Get current game state.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "game": {
      "id": "game_xyz789",
      "lobbyId": "lobby_abc123",
      "topic": "The Office",
      "currentQuestionIndex": 0,
      "totalQuestions": 10,
      "status": "in_progress",
      "players": [
        {
          "id": "user_123",
          "email": "user@example.com",
          "score": 0,
          "answeredCurrent": false
        }
      ],
      "leaderboard": [
        {
          "rank": 1,
          "playerId": "user_456",
          "playerName": "Michael Scott",
          "score": 1500
        }
      ]
    }
  }
}
```

---

### GET `/api/game/:gameId/question/current`
Get current question for the game.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "question": {
      "id": "q_123",
      "questionNumber": 1,
      "totalQuestions": 10,
      "difficulty": "easy",
      "text": "What is the name of the paper company where the main characters work?",
      "options": [
        {
          "id": "opt_a",
          "label": "A",
          "text": "Dunder Mifflin"
        },
        {
          "id": "opt_b",
          "label": "B",
          "text": "Staples"
        },
        {
          "id": "opt_c",
          "label": "C",
          "text": "Wernham Hogg"
        },
        {
          "id": "opt_d",
          "label": "D",
          "text": "Michael Scott Paper Company"
        }
      ],
      "timeLimit": 30
    }
  }
}
```

**Note:** The correct answer is NOT included in the response to prevent cheating.

---

### POST `/api/game/:gameId/answer`
Submit an answer to the current question.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "questionId": "q_123",
  "answerId": "opt_a",
  "timeRemaining": 25
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "correct": true,
    "correctAnswerId": "opt_a",
    "pointsEarned": 250,
    "newScore": 250,
    "explanation": "Correct! The show is set at Dunder Mifflin Paper Company in Scranton, PA."
  }
}
```

---

### GET `/api/game/:gameId/results`
Get final game results.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": {
      "gameId": "game_xyz789",
      "topic": "The Office",
      "totalQuestions": 10,
      "winner": {
        "playerId": "user_456",
        "playerName": "Michael Scott",
        "score": 1500
      },
      "leaderboard": [
        {
          "rank": 1,
          "playerId": "user_456",
          "playerName": "Michael Scott",
          "score": 1500,
          "correctAnswers": 10
        },
        {
          "rank": 2,
          "playerId": "user_789",
          "playerName": "Dwight Schrute",
          "score": 1450,
          "correctAnswers": 9
        },
        {
          "rank": 3,
          "playerId": "user_101",
          "playerName": "Jim Halpert",
          "score": 1350,
          "correctAnswers": 9
        },
        {
          "rank": 4,
          "playerId": "user_123",
          "playerName": "You",
          "score": 1200,
          "correctAnswers": 7
        }
      ],
      "yourPerformance": {
        "rank": 4,
        "score": 1200,
        "correctAnswers": 7,
        "totalQuestions": 10
      }
    }
  }
}
```

---

## 4. User Statistics Endpoints

### GET `/api/user/stats`
Get user statistics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "gamesPlayed": 247,
      "victories": 156,
      "timePlayed": "12h",
      "totalPoints": 45600,
      "averageScore": 185,
      "topicStats": [
        {
          "topic": "The Office",
          "gamesPlayed": 50,
          "victories": 30,
          "averageScore": 200
        }
      ]
    }
  }
}
```

---

## 5. WebSocket Events (Socket.io)

### Connection
**Event:** `connect`

**Client emits:**
```javascript
socket.emit('authenticate', {
  token: 'jwt_token_here'
});
```

**Server emits:**
```javascript
socket.emit('authenticated', {
  userId: 'user_123',
  socketId: 'socket_abc'
});
```

---

### Lobby Events

#### Join Lobby Room
**Client emits:**
```javascript
socket.emit('lobby:join', {
  lobbyId: 'lobby_abc123'
});
```

**Server emits to all in lobby:**
```javascript
socket.emit('lobby:player_joined', {
  player: {
    id: 'user_123',
    email: 'user@example.com',
    isOwner: false,
    isReady: false
  },
  players: [...] // Updated player list
});
```

---

#### Player Ready Status Changed
**Client emits:**
```javascript
socket.emit('lobby:ready', {
  lobbyId: 'lobby_abc123',
  isReady: true
});
```

**Server emits to all in lobby:**
```javascript
socket.emit('lobby:player_ready_changed', {
  playerId: 'user_123',
  isReady: true,
  readyCount: 3,
  totalPlayers: 4
});
```

---

#### Game Starting
**Server emits to all in lobby:**
```javascript
socket.emit('lobby:game_starting', {
  gameId: 'game_xyz789',
  countdown: 3 // seconds until game starts
});
```

---

#### Player Left Lobby
**Server emits to all in lobby:**
```javascript
socket.emit('lobby:player_left', {
  playerId: 'user_123',
  players: [...] // Updated player list
});
```

---

### Game Events

#### Game Started
**Server emits to all players:**
```javascript
socket.emit('game:started', {
  gameId: 'game_xyz789',
  totalQuestions: 10
});
```

---

#### New Question
**Server emits to all players:**
```javascript
socket.emit('game:new_question', {
  question: {
    id: 'q_123',
    questionNumber: 1,
    totalQuestions: 10,
    difficulty: 'easy',
    text: 'Question text here?',
    options: [...],
    timeLimit: 30
  }
});
```

---

#### Player Answered
**Server emits to all players:**
```javascript
socket.emit('game:player_answered', {
  playerId: 'user_123',
  playerName: 'John Doe',
  answeredCount: 3, // How many have answered so far
  totalPlayers: 4
});
```

---

#### Question Results
**Server emits to all players after time expires:**
```javascript
socket.emit('game:question_results', {
  correctAnswerId: 'opt_a',
  explanation: 'Explanation text...',
  leaderboard: [
    {
      rank: 1,
      playerId: 'user_456',
      playerName: 'Michael Scott',
      score: 1500
    }
  ]
});
```

---

#### Leaderboard Update
**Server emits to all players:**
```javascript
socket.emit('game:leaderboard_update', {
  leaderboard: [
    {
      rank: 1,
      playerId: 'user_456',
      playerName: 'Michael Scott',
      score: 1500
    }
  ]
});
```

---

#### Game Over
**Server emits to all players:**
```javascript
socket.emit('game:over', {
  gameId: 'game_xyz789',
  winner: {
    playerId: 'user_456',
    playerName: 'Michael Scott',
    score: 1500
  },
  finalLeaderboard: [...],
  redirectToLobby: false // or true to auto-redirect
});
```

---

#### Player Disconnected
**Server emits to all players:**
```javascript
socket.emit('game:player_disconnected', {
  playerId: 'user_123',
  playerName: 'John Doe'
});
```

---

## 6. Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  stats: {
    gamesPlayed: number;
    victories: number;
    timePlayed: number; // in seconds
    totalPoints: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Lobby
```typescript
interface Lobby {
  id: string;
  code: string; // e.g., "TRIVIA-2024"
  ownerId: string;
  settings: {
    topic: string;
    questionCount: number;
    difficulty: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
  players: Array<{
    id: string;
    email: string;
    isOwner: boolean;
    isReady: boolean;
    joinedAt: Date;
  }>;
  status: 'waiting' | 'starting' | 'in_progress' | 'completed';
  gameId?: string; // Set when game starts
  createdAt: Date;
  expiresAt: Date;
}
```

### Game
```typescript
interface Game {
  id: string;
  lobbyId: string;
  topic: string;
  questions: Question[];
  currentQuestionIndex: number;
  players: Array<{
    id: string;
    email: string;
    score: number;
    answers: Array<{
      questionId: string;
      answerId: string;
      timeRemaining: number;
      correct: boolean;
      pointsEarned: number;
    }>;
  }>;
  status: 'waiting' | 'in_progress' | 'completed';
  startedAt: Date;
  completedAt?: Date;
}
```

### Question
```typescript
interface Question {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: Array<{
    id: string;
    label: string; // A, B, C, D
    text: string;
  }>;
  correctAnswerId: string;
  explanation?: string;
  timeLimit: number; // in seconds
}
```

---

## 7. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `EMAIL_EXISTS` | 400 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `UNAUTHORIZED` | 401 | No valid authentication token |
| `LOBBY_NOT_FOUND` | 404 | Invalid lobby code |
| `LOBBY_FULL` | 400 | Lobby has reached max players |
| `GAME_NOT_FOUND` | 404 | Game does not exist |
| `NOT_OWNER` | 403 | Action requires lobby owner |
| `NOT_IN_LOBBY` | 403 | User is not in this lobby |
| `GAME_ALREADY_STARTED` | 400 | Cannot join, game in progress |
| `INVALID_ANSWER` | 400 | Answer submission invalid |
| `ALREADY_ANSWERED` | 400 | Already answered this question |
| `TIME_EXPIRED` | 400 | Time limit exceeded |

---

## 8. Real-time Game Flow

1. **Lobby Creation/Join**
   - User creates or joins lobby via REST API
   - Client connects to Socket.io and joins lobby room
   - Lobby updates broadcast to all connected players

2. **Ready Status**
   - Players toggle ready via WebSocket
   - Ready count updates in real-time
   - Owner sees when all players are ready

3. **Game Start**
   - Owner clicks "Start Game" (REST or WebSocket)
   - Server broadcasts `game:starting` with countdown
   - Server broadcasts `game:started` and first question

4. **Question Flow**
   - Server broadcasts `game:new_question` to all players
   - Players submit answers via REST or WebSocket
   - Server broadcasts `game:player_answered` (without revealing answer)
   - After time expires, server broadcasts `game:question_results`
   - Server broadcasts updated leaderboard

5. **Game End**
   - After last question, server broadcasts `game:over`
   - Final leaderboard and stats shown
   - Players can return to lobby or home

---

## 9. Scoring System

### Points Calculation
```
basePoints = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : 300
timeBonus = (timeRemaining / timeLimit) * 100
totalPoints = basePoints + timeBonus
```

**Example:**
- Easy question (30s timer)
- Answered correctly with 25s remaining
- Score: 100 + (25/30 * 100) = 100 + 83 = 183 points

---

## 10. Rate Limiting

- Authentication endpoints: 5 requests per minute per IP
- Game API: 100 requests per minute per user
- WebSocket connections: 1 per user

---

## 11. Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/trivia_quest

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Socket.io
SOCKET_CORS_ORIGIN=http://localhost:5173

# Game Settings
MAX_PLAYERS_PER_LOBBY=10
LOBBY_EXPIRY_TIME=3600 # 1 hour in seconds
QUESTION_TIME_LIMIT=30 # seconds
```

---

## 12. Testing Endpoints

### GET `/api/health`
Health check endpoint.

**Response (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-25T10:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All endpoints require HTTPS in production
- WebSocket connections must authenticate within 10 seconds
- Inactive lobbies are automatically cleaned up after 1 hour
- Game state is persisted to database for analytics
- Consider implementing replay/spectator mode in future versions
