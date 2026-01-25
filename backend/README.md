# Trivia Quest Backend

Backend API for the Trivia Quest multiplayer quiz application.

## Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Redis** - Real-time leaderboards and caching
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing

## Prerequisites

- Node.js v18 or higher
- PostgreSQL v15 or higher
- Redis v7 or higher

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update the `.env` file with your database credentials:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/trivia_quest
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key_here_minimum_32_characters_long
```

## Database Setup

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE trivia_quest;

# Exit psql
\q
```

### Run Migrations

```bash
npm run migrate:up
```

### Seed Sample Data

```bash
npm run db:seed
```

### Reset Database (Migrations + Seeds)

```bash
npm run db:reset
```

## Development

### Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3001`

### Build for Production

```bash
npm run build
npm start
```

## Testing

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## API Endpoints

### Health Check

```bash
GET /api/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-25T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and Redis configuration
│   ├── models/          # Database models
│   ├── controllers/     # Request handlers
│   ├── routes/          # Route definitions
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── server.ts        # Express app setup
├── migrations/          # Database migrations
├── seeds/               # Database seed data
├── tests/               # Test files
├── .env                 # Environment variables (not committed)
├── .env.example         # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `REDIS_TTL_LEADERBOARD` | Leaderboard cache TTL (seconds) | `86400` |
| `REDIS_TTL_LOBBY_SESSION` | Lobby session TTL (seconds) | `3600` |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

## Database Schema

See [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) for complete schema documentation.

### Tables

- **users** - User accounts and statistics
- **topics** - Quiz topics/categories
- **questions** - Quiz questions with options
- **lobbies** - Game lobbies/waiting rooms
- **lobby_players** - Players in lobbies
- **games** - Active and completed games
- **player_progress** - Individual player progress in games
- **answer_submissions** - Answer submissions and scoring

## Development Milestones

This project is being developed in 8 milestones. See [MILESTONES.md](../MILESTONES.md) for the complete development plan.

**Current Status:** Milestone 1 Complete ✅

- [x] Project Setup & Database Foundation
- [ ] Authentication System
- [ ] Topic & Question Management
- [ ] Lobby System
- [ ] Game Engine Core
- [ ] Real-time Features (Socket.io)
- [ ] User Statistics & Leaderboard
- [ ] Testing, Documentation & Deployment
