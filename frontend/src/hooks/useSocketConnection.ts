import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { socketService } from '../services/socket';

export const useSocketConnection = () => {
  const {
    token,
    isAuthenticated,
    setSocketConnected,
    updateLobbyPlayers,
    updatePlayerReady,
    setCurrentGame,
    setCurrentQuestion,
    updateLeaderboard,
    setGameResults,
    setError,
  } = useStore();

  useEffect(() => {
    if (isAuthenticated && token && !socketService.isConnected()) {
      const initSocket = async () => {
        try {
          await socketService.connect(token);
          setSocketConnected(true);
          setupSocketListeners();
        } catch (error) {
          console.error('Failed to connect socket:', error);
          setSocketConnected(false);
          setError('Failed to connect to server');
        }
      };

      initSocket();
    }

    return () => {
      if (!isAuthenticated) {
        socketService.disconnect();
        setSocketConnected(false);
      }
    };
  }, [isAuthenticated, token, setSocketConnected, setError]);

  const setupSocketListeners = () => {
    // Lobby events
    socketService.onLobbyPlayerJoined(({ players }) => {
      updateLobbyPlayers(players);
    });

    socketService.onLobbyPlayerReadyChanged(({ playerId, isReady }) => {
      updatePlayerReady(playerId, isReady);
    });

    socketService.onLobbyGameStarting(({ gameId }) => {
      // Navigate to game will be handled by the component
      setCurrentGame({
        id: gameId,
        lobbyId: '',
        status: 'in_progress',
        currentQuestionIndex: 0,
        totalQuestions: 0,
        currentQuestion: null,
        leaderboard: [],
        timeRemaining: 30,
        selectedAnswer: null,
        selectedAnswers: [],
        hasAnswered: false,
        players: [],
      });
    });

    socketService.onLobbyPlayerLeft(({ players }) => {
      updateLobbyPlayers(players);
    });

    // Game events
    socketService.onGameStarted(({ gameId, totalQuestions }) => {
      setCurrentGame({
        id: gameId,
        lobbyId: '',
        status: 'in_progress',
        currentQuestionIndex: 0,
        totalQuestions,
        currentQuestion: null,
        leaderboard: [],
        timeRemaining: 30,
        selectedAnswer: null,
        selectedAnswers: [],
        hasAnswered: false,
        players: [],
      });
    });

    socketService.onNewQuestion(({ question }) => {
      setCurrentQuestion(question);
    });

    socketService.onLeaderboardUpdate(({ leaderboard }) => {
      updateLeaderboard(leaderboard);
    });

    socketService.onGameOver(({ gameId, winner, finalLeaderboard }) => {
      setGameResults({
        gameId,
        status: 'completed',
        totalQuestions: 0,
        winner,
        finalLeaderboard,
        yourPerformance: {
          rank: 0,
          score: 0,
          correctAnswers: 0,
          totalQuestions: 0,
        },
      });
    });
  };

  return {
    isSocketConnected: socketService.isConnected(),
    socketService,
  };
};