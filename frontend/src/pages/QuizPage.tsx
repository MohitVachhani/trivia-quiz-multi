import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, AlertCircle, Users, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { gameAPI } from '../services/api';
import { socketService } from '../services/socket';

export default function QuizPage() {
  const navigate = useNavigate();
  const {
    currentGame,
    setCurrentQuestion,
    setSelectedAnswers,
    setTimeRemaining,
    setHasAnswered,
    updateLeaderboard,
    setGameResults,
    setError,
    user,
  } = useStore();

  const [playersAnswered, setPlayersAnswered] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [showingResults, setShowingResults] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [correctAnswerIds, setCorrectAnswerIds] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentGame || !user) {
      navigate('/multiplayer');
      return;
    }

    // Set up socket listeners
    const handleNewQuestion = ({ question }: { question: any }) => {
      setCurrentQuestion(question, currentGame.currentQuestionIndex + 1, currentGame.totalQuestions);
      setTimeRemaining(question.timeLimit || 30);
      setHasAnswered(false);
      setShowingResults(false);
      setPlayersAnswered(0);
      startTimer();
    };

    const handlePlayerAnswered = ({ answeredCount, totalPlayers: total }: { answeredCount: number; totalPlayers: number }) => {
      setPlayersAnswered(answeredCount);
      setTotalPlayers(total);
    };

    const handleQuestionResults = ({ 
      correctAnswerIds: correct, 
      explanation: exp, 
      pointsEarned: points, 
      newScore 
    }: { 
      correctAnswerIds: string[]; 
      explanation: string; 
      pointsEarned: number; 
      newScore: number;
    }) => {
      setCorrectAnswerIds(correct);
      setExplanation(exp);
      setPointsEarned(points);
      setShowingResults(true);
      setHasAnswered(true);
      stopTimer();
      
      // Update player's score in leaderboard
      if (currentGame?.leaderboard) {
        const updatedLeaderboard = currentGame.leaderboard.map(entry => 
          entry.playerId === user.id ? { ...entry, score: newScore } : entry
        );
        updateLeaderboard(updatedLeaderboard);
      }
    };

    const handleLeaderboardUpdate = ({ leaderboard }: { leaderboard: any[] }) => {
      updateLeaderboard(leaderboard);
    };

    const handleGameOver = ({ gameId, winner, finalLeaderboard }: { gameId: string; winner: any; finalLeaderboard: any[] }) => {
      const yourPerformance = finalLeaderboard.find(entry => entry.playerId === user.id);
      setGameResults({
        gameId,
        status: 'completed',
        totalQuestions: currentGame.totalQuestions,
        winner,
        finalLeaderboard,
        yourPerformance: yourPerformance ? {
          rank: yourPerformance.rank,
          score: yourPerformance.score,
          correctAnswers: yourPerformance.correctAnswers || 0,
          totalQuestions: currentGame.totalQuestions,
        } : {
          rank: finalLeaderboard.length + 1,
          score: 0,
          correctAnswers: 0,
          totalQuestions: currentGame.totalQuestions,
        },
      });
      navigate('/results');
    };

    socketService.onNewQuestion(handleNewQuestion);
    socketService.onPlayerAnswered(handlePlayerAnswered);
    socketService.onQuestionResults(handleQuestionResults);
    socketService.onLeaderboardUpdate(handleLeaderboardUpdate);
    socketService.onGameOver(handleGameOver);

    // Get initial question if we don't have one
    if (!currentGame.currentQuestion) {
      loadCurrentQuestion();
    } else {
      startTimer();
    }

    return () => {
      socketService.offNewQuestion(handleNewQuestion);
      socketService.offPlayerAnswered(handlePlayerAnswered);
      socketService.offQuestionResults(handleQuestionResults);
      socketService.offLeaderboardUpdate(handleLeaderboardUpdate);
      socketService.offGameOver(handleGameOver);
      stopTimer();
    };
  }, [currentGame, user, navigate]);

  const loadCurrentQuestion = async () => {
    if (!currentGame) return;

    try {
      const question = await gameAPI.getCurrentQuestion(currentGame.id);
      setCurrentQuestion(question, currentGame.currentQuestionIndex + 1, currentGame.totalQuestions);
      setTimeRemaining(question.timeLimit || 30);
      startTimer();
    } catch (err) {
      console.error('Failed to load question:', err);
      setError('Failed to load question');
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = window.setInterval(() => {
      if (currentGame && currentGame.timeRemaining > 0) {
        const newTime = Math.max(0, currentGame.timeRemaining - 1);
        setTimeRemaining(newTime);
        
        if (newTime === 0 && !currentGame.hasAnswered) {
          // Time's up - auto submit if not answered
          handleSubmitAnswer();
        }
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    if (!currentGame || currentGame.hasAnswered || showingResults) return;

    const currentQuestion = currentGame.currentQuestion;
    if (!currentQuestion) return;

    let newSelectedAnswers: string[];

    if (currentQuestion.type === 'multi_correct') {
      // Multiple choice - toggle answer
      const current = currentGame.selectedAnswers || [];
      newSelectedAnswers = current.includes(answerId)
        ? current.filter(id => id !== answerId)
        : [...current, answerId];
    } else {
      // Single choice - replace answer
      newSelectedAnswers = [answerId];
    }

    setSelectedAnswers(newSelectedAnswers);
  };

  const handleSubmitAnswer = async () => {
    if (!currentGame || !currentGame.currentQuestion) return;

    const selectedAnswers = currentGame.selectedAnswers || [];
    
    try {
      setHasAnswered(true);
      stopTimer();

      await gameAPI.submitAnswer(
        currentGame.id,
        currentGame.currentQuestion.id,
        selectedAnswers,
        currentGame.timeRemaining
      );
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setError('Failed to submit answer');
      setHasAnswered(false);
      startTimer();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAnswerStyles = (optionId: string) => {
    const selectedAnswers = currentGame?.selectedAnswers || [];
    const isSelected = selectedAnswers.includes(optionId);

    if (!showingResults) {
      return isSelected
        ? 'border-primary-500 bg-primary-50 shadow-md'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm';
    }

    // After results shown
    if (correctAnswerIds.includes(optionId)) {
      return 'border-green-500 bg-green-500 text-white';
    }
    if (isSelected && !correctAnswerIds.includes(optionId)) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200 bg-gray-50 opacity-50';
  };

  if (!currentGame || !currentGame.currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  const question = currentGame.currentQuestion;
  const questionNumber = question.questionNumber || currentGame.currentQuestionIndex + 1;
  const totalQuestions = question.totalQuestions || currentGame.totalQuestions;
  const progress = (questionNumber / totalQuestions) * 100;
  const selectedAnswers = currentGame.selectedAnswers || [];
  const canSubmit = selectedAnswers.length > 0 && !currentGame.hasAnswered && !showingResults;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/game-room')}
          className="mb-4 p-2 hover:bg-white rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quiz Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Question {questionNumber} of {totalQuestions}
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{playersAnswered}/{totalPlayers} answered</span>
                    </div>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    currentGame.timeRemaining <= 5 ? 'bg-red-100' : 'bg-blue-100'
                  }`}
                >
                  <Clock
                    className={`w-5 h-5 ${
                      currentGame.timeRemaining <= 5 ? 'text-red-600' : 'text-blue-600'
                    }`}
                  />
                  <span
                    className={`font-bold ${
                      currentGame.timeRemaining <= 5 ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    {currentGame.timeRemaining}s
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="glass-card p-8">
              <div className="mb-6">
                <span
                  className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(
                    question.difficulty
                  )}`}
                >
                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </span>
                {question.type === 'multi_correct' && (
                  <span className="ml-2 inline-block px-3 py-1 text-xs font-semibold rounded-full border bg-blue-100 text-blue-700 border-blue-200">
                    Multiple Correct
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                {question.text}
              </h3>

              {/* Options */}
              <div className="space-y-4">
                {question.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    disabled={currentGame.hasAnswered || showingResults}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${getAnswerStyles(
                      option.id
                    )} ${!currentGame.hasAnswered && !showingResults ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                          showingResults && correctAnswerIds.includes(option.id)
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {option.label}
                      </div>
                      <span className="text-lg font-medium">{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              {!currentGame.hasAnswered && !showingResults && (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!canSubmit}
                  className="btn-gradient w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer{selectedAnswers.length > 1 ? 's' : ''}
                </button>
              )}

              {/* Results */}
              {showingResults && (
                <div className="mt-6 space-y-4">
                  <div className={`flex items-start gap-3 p-4 border rounded-xl ${
                    pointsEarned > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <AlertCircle className={`w-5 h-5 mt-0.5 ${
                      pointsEarned > 0 ? 'text-green-600' : 'text-red-600'
                    }`} />
                    <div>
                      <p className={`font-semibold ${
                        pointsEarned > 0 ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {pointsEarned > 0 ? `Correct! +${pointsEarned} points` : 'Incorrect'}
                      </p>
                      {explanation && (
                        <p className={`text-sm mt-1 ${
                          pointsEarned > 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-900">Leaderboard</h3>
              </div>

              <div className="space-y-3">
                {currentGame.leaderboard.map((entry) => (
                  <div
                    key={entry.playerId}
                    className={`p-4 rounded-xl ${
                      entry.playerId === user?.id
                        ? 'bg-primary-50 border-2 border-primary-500'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            entry.rank === 1
                              ? 'bg-yellow-400 text-yellow-900'
                              : entry.rank === 2
                              ? 'bg-gray-300 text-gray-700'
                              : entry.rank === 3
                              ? 'bg-orange-400 text-orange-900'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {entry.rank}
                        </div>
                        <div>
                          <p
                            className={`font-semibold text-sm ${
                              entry.playerId === user?.id
                                ? 'text-primary-700'
                                : 'text-gray-900'
                            }`}
                          >
                            {entry.playerId === user?.id ? 'You' : entry.playerName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {entry.score.toLocaleString()}
                        </p>
                        {entry.correctAnswers !== undefined && (
                          <p className="text-xs text-gray-500">
                            {entry.correctAnswers} correct
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}