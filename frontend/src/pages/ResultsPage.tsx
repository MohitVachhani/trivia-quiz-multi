import { useNavigate } from 'react-router-dom';
import { Trophy, Home, RotateCcw, Star, Medal } from 'lucide-react';

// Mock data
const MOCK_RESULTS = {
  gameId: 'game_123',
  topic: 'The Office Trivia',
  totalQuestions: 10,
  winner: {
    playerId: 'user_2',
    playerName: 'Michael Scott',
    score: 1500,
  },
  leaderboard: [
    {
      rank: 2,
      playerId: 'user_4',
      playerName: 'Dwight Schrute',
      score: 1450,
      correctAnswers: 9,
    },
    {
      rank: 1,
      playerId: 'user_2',
      playerName: 'Michael Scott',
      score: 1500,
      correctAnswers: 10,
    },
    {
      rank: 3,
      playerId: 'user_3',
      playerName: 'Jim Halpert',
      score: 1350,
      correctAnswers: 9,
    },
  ],
  otherPlayers: [
    {
      rank: 4,
      playerId: 'user_1',
      playerName: 'You',
      score: 1200,
      correctAnswers: 7,
    },
  ],
  yourPerformance: {
    rank: 4,
    score: 1200,
    correctAnswers: 7,
    totalQuestions: 10,
  },
};

export default function ResultsPage() {
  const navigate = useNavigate();

  const podium = MOCK_RESULTS.leaderboard.sort((a, b) => a.rank - b.rank);
  const [first, second, third] = podium;

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
            {MOCK_RESULTS.topic} • {MOCK_RESULTS.totalQuestions} Questions
          </p>
        </div>

        {/* Winner Spotlight */}
        <div className="glass-card p-8 mb-6 bg-gradient-winner border-2 border-yellow-200">
          <div className="text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" fill="currentColor" />
            <p className="text-sm text-gray-600 mb-1">Winner</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {MOCK_RESULTS.winner.playerName}
            </h2>
            <p className="text-2xl font-bold text-primary-600">
              {MOCK_RESULTS.winner.score.toLocaleString()} points
            </p>
          </div>
        </div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-4 mb-6 items-end">
          {/* Second Place */}
          {second && (
            <div className="glass-card p-6 text-center">
              <div className="flex justify-center mb-3">
                {getTrophyIcon(2)}
              </div>
              <p className="text-sm text-gray-500 mb-1">2nd</p>
              <p className="font-bold text-gray-900 mb-1">{second.playerName}</p>
              <p className="text-lg font-bold text-primary-600">{second.score}</p>
            </div>
          )}

          {/* First Place */}
          {first && (
            <div className="glass-card p-6 text-center bg-gradient-to-b from-yellow-50 to-white border-2 border-yellow-300 transform scale-105">
              <div className="flex justify-center mb-3">
                {getTrophyIcon(1)}
              </div>
              <p className="text-sm text-gray-500 mb-1">1st</p>
              <p className="font-bold text-gray-900 mb-1">{first.playerName}</p>
              <p className="text-xl font-bold text-primary-600">{first.score}</p>
            </div>
          )}

          {/* Third Place */}
          {third && (
            <div className="glass-card p-6 text-center">
              <div className="flex justify-center mb-3">
                {getTrophyIcon(3)}
              </div>
              <p className="text-sm text-gray-500 mb-1">3rd</p>
              <p className="font-bold text-gray-900 mb-1">{third.playerName}</p>
              <p className="text-lg font-bold text-primary-600">{third.score}</p>
            </div>
          )}
        </div>

        {/* Other Players */}
        {MOCK_RESULTS.otherPlayers.length > 0 && (
          <div className="glass-card p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Other Players</h3>
            <div className="space-y-3">
              {MOCK_RESULTS.otherPlayers.map((player) => (
                <div
                  key={player.playerId}
                  className="p-4 bg-primary-50 border-2 border-primary-500 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                        {player.rank}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {player.playerName}{' '}
                          <span className="text-gray-500 text-sm">(You)</span>
                        </p>
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

        {/* Your Performance */}
        <div className="glass-card p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Performance</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600 mb-1">
                {MOCK_RESULTS.yourPerformance.correctAnswers}/
                {MOCK_RESULTS.yourPerformance.totalQuestions}
              </p>
              <p className="text-sm text-gray-600">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600 mb-1">
                {MOCK_RESULTS.yourPerformance.score.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Points</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500 mb-1">
                #{MOCK_RESULTS.yourPerformance.rank}
              </p>
              <p className="text-sm text-gray-600">Rank</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/game-room')}
            className="py-4 px-6 bg-white border-2 border-primary-500 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
          <button
            onClick={() => navigate('/game-mode')}
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
