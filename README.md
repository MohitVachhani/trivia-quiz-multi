# Trivia Quiz Application

A full-stack trivia quiz application with React frontend and Node.js/Express backend.

## Project Structure

```
trivia-quiz-multi/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Node.js + Express + TypeScript
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check
- `GET /api/trivia/questions` - Get trivia questions
- `POST /api/trivia/answer` - Submit an answer

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- ESLint

### Backend
- Node.js
- Express
- TypeScript
- CORS
- dotenv

## Development

Both frontend and backend support hot reloading during development.

## Environment Variables

Backend `.env` file:
```
PORT=3001
NODE_ENV=development
```