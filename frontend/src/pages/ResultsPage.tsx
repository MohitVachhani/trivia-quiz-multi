import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Home, RotateCcw, Star, Medal } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { gameResults, user, setCurrentLobby, setCurrentGame, setGameResults } = useStore();

  useEffect(() => {
    if (!gameResults) {
      // If no game results, redirect to home
      navigate('/game-mode');
    }
  }, [gameResults, navigate]);

  if (!gameResults || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const podiumPlayers = gameResults.finalLeaderboard.filter(p => p.rank <= 3).sort((a, b) => a.rank - b.rank);
  const otherPlayers = gameResults.finalLeaderboard.filter(p => p.rank > 3);

  const getTrophyIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" fill="currentColor" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Medal className="w-8 h-8 text-orange-400" />;
      default:
        return null;
    }
  };

  const handlePlayAgain = () => {
    // Clear current game state and go to multiplayer lobby
    setCurrentLobby(null);
    setCurrentGame(null);
    setGameResults(null);
    navigate('/multiplayer');
  };

  const handleGoHome = () => {
    // Clear all game state and go home
    setCurrentLobby(null);
    setCurrentGame(null);
    setGameResults(null);
    navigate('/game-mode');
  };

  const getRankSuffix = (rank: number) => {
    const lastDigit = rank % 10;
    const lastTwoDigits = rank % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return 'th';
    }
    
    switch (lastDigit) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-purple-50 to-blue-50 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Game Over!</h1>
          <p className="text-gray-600">
            {gameResults.totalQuestions} Questions
          </p>
        </div>

        {/* Winner Spotlight */}
        <div className="glass-card p-8 mb-6 bg-gradient-winner border-2 border-yellow-200">
          <div className="text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" fill="currentColor" />
            <p className="text-sm text-gray-600 mb-1">Winner</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {gameResults.winner.playerId === user.id ? 'You' : gameResults.winner.playerName}
            </h2>
            <p className="text-2xl font-bold text-primary-600">
              {gameResults.winner.score.toLocaleString()} points
            </p>
          </div>
        </div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-4 mb-6 items-end">
          {/* Second Place */}
          {podiumPlayers[1] && (
            <div className={`glass-card p-6 text-center ${
              podiumPlayers[1].playerId === user.id ? 'bg-primary-50 border-2 border-primary-500' : ''
            }`}>
              <div className="flex justify-center mb-3">
                {getTrophyIcon(2)}
              </div>
              <p className="text-sm text-gray-500 mb-1">2nd</p>
              <p className="font-bold text-gray-900 mb-1">
                {podiumPlayers[1].playerId === user.id ? 'You' : podiumPlayers[1].playerName}
              </p>
              <p className="text-lg font-bold text-primary-600">{podiumPlayers[1].score.toLocaleString()}</p>
              <p className="text-sm text-gray-600">{podiumPlayers[1].correctAnswers} correct</p>
            </div>
          )}

          {/* First Place */}
          {podiumPlayers[0] && (
            <div className={`glass-card p-6 text-center transform scale-105 ${
              podiumPlayers[0].playerId === user.id 
                ? 'bg-gradient-to-b from-yellow-100 to-primary-50 border-2 border-yellow-400' 
                : 'bg-gradient-to-b from-yellow-50 to-white border-2 border-yellow-300'
            }`}>
              <div className="flex justify-center mb-3">
                {getTrophyIcon(1)}
              </div>
              <p className="text-sm text-gray-500 mb-1">1st</p>
              <p className="font-bold text-gray-900 mb-1">
                {podiumPlayers[0].playerId === user.id ? 'You' : podiumPlayers[0].playerName}
              </p>
              <p className="text-xl font-bold text-primary-600">{podiumPlayers[0].score.toLocaleString()}</p>
              <p className="text-sm text-gray-600">{podiumPlayers[0].correctAnswers} correct</p>
            </div>
          )}

          {/* Third Place */}
          {podiumPlayers[2] && (
            <div className={`glass-card p-6 text-center ${
              podiumPlayers[2].playerId === user.id ? 'bg-primary-50 border-2 border-primary-500' : ''
            }`}>
              <div className="flex justify-center mb-3">
                {getTrophyIcon(3)}
              </div>
              <p className="text-sm text-gray-500 mb-1">3rd</p>
              <p className="font-bold text-gray-900 mb-1">
                {podiumPlayers[2].playerId === user.id ? 'You' : podiumPlayers[2].playerName}
              </p>
              <p className="text-lg font-bold text-primary-600">{podiumPlayers[2].score.toLocaleString()}</p>
              <p className="text-sm text-gray-600">{podiumPlayers[2].correctAnswers} correct</p>
            </div>
          )}
        </div>

        {/* Other Players (4th place and below) */}
        {otherPlayers.length > 0 && (
          <div className="glass-card p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Other Players</h3>
            <div className="space-y-3">
              {otherPlayers.map((player) => (
                <div
                  key={player.playerId}
                  className={`p-4 rounded-xl ${
                    player.playerId === user.id
                      ? 'bg-primary-50 border-2 border-primary-500'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        player.playerId === user.id ? 'bg-gradient-primary' : 'bg-gray-400'
                      }`}>
                        {player.rank}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {player.playerId === user.id ? 'You' : player.playerName}
                        </p>
                        <p className="text-sm text-gray-600">{player.correctAnswers} correct answers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {player.score.toLocaleString()} pts
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your Performance Summary */}
        <div className="glass-card p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Performance</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600 mb-1">
                {gameResults.yourPerformance.correctAnswers}/
                {gameResults.yourPerformance.totalQuestions}
              </p>
              <p className="text-sm text-gray-600">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600 mb-1">
                {gameResults.yourPerformance.score.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Points</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500 mb-1">
                {gameResults.yourPerformance.rank}{getRankSuffix(gameResults.yourPerformance.rank)}
              </p>
              <p className="text-sm text-gray-600">Place</p>
            </div>
          </div>
          
          {/* Performance Message */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900 text-center">
              {gameResults.yourPerformance.rank === 1 && "🎉 Congratulations! You won!"}
              {gameResults.yourPerformance.rank === 2 && "🥈 Great job! Second place!"}
              {gameResults.yourPerformance.rank === 3 && "🥉 Well done! Third place!"}
              {gameResults.yourPerformance.rank > 3 && `You finished in ${gameResults.yourPerformance.rank}${getRankSuffix(gameResults.yourPerformance.rank)} place. Keep practicing!`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handlePlayAgain}
            className="py-4 px-6 bg-white border-2 border-primary-500 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
          <button
            onClick={handleGoHome}
            className="btn-gradient py-4 px-6 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}