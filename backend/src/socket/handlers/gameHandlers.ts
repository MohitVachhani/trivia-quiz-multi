import { Server, Socket } from 'socket.io';
import { socketStore } from '../socketStore';
import { getLeaderboard } from '../../services/leaderboardService';

/**
 * Emit when game starts
 */
export function emitGameStarted(io: Server, gameId: string, lobbyId: string, players: string[]) {
  // Move all players from lobby room to game room
  players.forEach(playerId => {
    const socket = socketStore.findSocketByUserId(io, playerId);
    if (socket) {
      socket.leave(`lobby:${lobbyId}`);
      socket.join(`game:${gameId}`);
    }
  });

  io.to(`game:${gameId}`).emit('game:started', {
    gameId,
    message: 'Game has started! Good luck!'
  });
}

/**
 * Emit when player gets new question (individual message)
 */
export function emitNewQuestion(io: Server, userId: string, questionData: any) {
  const socket = socketStore.findSocketByUserId(io, userId);
  if (socket) {
    socket.emit('game:new_question', {
      question: {
        id: questionData.id,
        type: questionData.type,
        questionNumber: questionData.questionNumber,
        totalQuestions: questionData.totalQuestions,
        difficulty: questionData.difficulty,
        text: questionData.text,
        options: questionData.options
        // NO correctAnswerIds!
      }
    });
  }
}

/**
 * Broadcast when player submits answer
 */
export async function emitPlayerAnswered(io: Server, gameId: string, userId: string, email: string) {
  try {
    // For now, we'll emit without the count - can be enhanced later
    io.to(`game:${gameId}`).emit('game:player_answered', {
      playerId: userId,
      playerName: email,
      message: `${email} has answered!`
    });
  } catch (error) {
    console.error('Error in emitPlayerAnswered:', error);
  }
}

/**
 * Emit question results to individual player
 */
export function emitQuestionResults(io: Server, userId: string, result: any) {
  const socket = socketStore.findSocketByUserId(io, userId);
  if (socket) {
    socket.emit('game:question_results', {
      isCorrect: result.isCorrect,
      correctAnswerIds: result.correctAnswerIds,
      explanation: result.explanation,
      pointsEarned: result.pointsEarned,
      newScore: result.newScore
    });
  }
}

/**
 * Broadcast leaderboard updates
 */
export async function emitLeaderboardUpdate(io: Server, gameId: string) {
  try {
    const leaderboard = await getLeaderboard(gameId);

    io.to(`game:${gameId}`).emit('game:leaderboard_update', {
      leaderboard
    });
  } catch (error) {
    console.error('Error in emitLeaderboardUpdate:', error);
  }
}

/**
 * Broadcast when game ends
 */
export function emitGameOver(io: Server, gameId: string, results: any) {
  io.to(`game:${gameId}`).emit('game:over', {
    gameId,
    winner: results.winner,
    finalLeaderboard: results.leaderboard,
    message: `Game Over! Winner: ${results.winner?.playerName || 'Unknown'}`
  });
}

/**
 * Broadcast when player disconnects
 */
export function emitPlayerDisconnected(io: Server, gameId: string, userId: string, email: string) {
  io.to(`game:${gameId}`).emit('game:player_disconnected', {
    playerId: userId,
    playerName: email,
    message: `${email} has disconnected`
  });
}