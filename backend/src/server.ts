import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passport from './config/passport';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import topicRoutes from './routes/topics';
import lobbyRoutes from './routes/lobby';
import gameRoutes from './routes/game';
import { errorHandler } from './middleware/errorHandler';
import { initializeSocket } from './socket';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.io
export const io = initializeSocket(server);

// Make io available to services
export function getIO() {
  return io;
}

// Security middleware
app.use(helmet());

// CORS middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Trivia Quest Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      quiz: '/api/quiz',
      lobby: '/api/lobby',
      game: '/api/game',
    },
  });
});

// Health check route
app.use('/api', healthRoutes);

// Auth routes
app.use('/api/auth', authRoutes);

// Quiz/Topic routes
app.use('/api/quiz', topicRoutes);

// Lobby routes
app.use('/api/lobby', lobbyRoutes);

// Game routes
app.use('/api/game', gameRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.io initialized`);
});

export default app;
