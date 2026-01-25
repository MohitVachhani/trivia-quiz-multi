import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Crown, Play, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';

// Mock data - will be replaced with real data from WebSocket
const MOCK_ROOM_CODE = 'TRIVIA-2024';
const MOCK_PLAYERS = [
  { id: 'user_1', email: 'you@example.com', isOwner: true, isReady: false },
  { id: 'user_2', email: 'michael@dundermifflin.com', isOwner: false, isReady: true },
  { id: 'user_3', email: 'jim@dundermifflin.com', isOwner: false, isReady: false },
  { id: 'user_4', email: 'dwight@dundermifflin.com', isOwner: false, isReady: true },
];

export default function GameRoomPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [players, setPlayers] = useState(MOCK_PLAYERS);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const currentPlayer = players.find((p) => p.email === user?.email) || players[0];
  const isOwner = currentPlayer?.isOwner || false;
  const readyCount = players.filter((p) => p.isReady).length;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(MOCK_ROOM_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === currentPlayer.id ? { ...p, isReady: !p.isReady } : p
      )
    );
  };

  const handleStartGame = () => {
    if (isOwner) {
      // Show settings modal first
      setShowSettings(true);
    }
  };

  const handleConfirmStart = () => {
    // TODO: API call to start game
    setShowSettings(false);
    navigate('/quiz');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/multiplayer')}
            className="p-2 hover:bg-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Game Room</h1>
            <p className="text-gray-500 mt-1">Waiting for players...</p>
          </div>
        </div>

        {/* Room Code Card */}
        <div className="glass-card p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Room Code</p>
            <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
              {MOCK_ROOM_CODE}
            </p>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary-500 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Players List */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Players ({players.length})
            </h2>
            <p className="text-sm">
              <span className="text-green-600 font-semibold">{readyCount} Ready</span>
              <span className="text-gray-400"> / {players.length}</span>
            </p>
          </div>

          <div className="space-y-3">
            {players.map((player) => {
              const isCurrentUser = player.id === currentPlayer.id;
              const playerName = player.isOwner
                ? 'You'
                : player.email.split('@')[0];

              return (
                <div
                  key={player.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    player.isReady
                      ? 'border-green-500 bg-green-50'
                      : isCurrentUser
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Player Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                        {playerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {playerName}
                            {isCurrentUser && (
                              <span className="text-gray-500 ml-1">(You)</span>
                            )}
                          </p>
                          {player.isOwner && (
                            <Crown className="w-4 h-4 text-yellow-500" fill="currentColor" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{player.email}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {player.isReady ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="w-5 h-5" />
                          <span className="font-semibold">Ready</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="w-5 h-5 border-2 border-current rounded-full" />
                          <span className="font-semibold">Waiting</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isOwner ? (
            <button
              onClick={handleStartGame}
              disabled={readyCount < players.length}
              className="btn-gradient w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Start Game
              {readyCount < players.length && (
                <span className="text-sm">
                  (Wait for all players to be ready)
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={handleToggleReady}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                currentPlayer.isReady
                  ? 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                  : 'btn-gradient'
              }`}
            >
              <Play className="w-5 h-5" fill="currentColor" />
              {currentPlayer.isReady ? 'Mark as Not Ready' : 'Mark as Ready'}
            </button>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass-card p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-primary-600" />
              <h3 className="text-2xl font-bold text-gray-900">Game Settings</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Topic
                </label>
                <select className="input-field">
                  <option>The Office</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Number of Questions
                </label>
                <select className="input-field">
                  <option value="5">5 Questions</option>
                  <option value="10" selected>
                    10 Questions
                  </option>
                  <option value="15">15 Questions</option>
                  <option value="20">20 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Difficulty Mix
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Easy"
                    defaultValue="4"
                    min="0"
                    className="input-field text-center"
                  />
                  <input
                    type="number"
                    placeholder="Medium"
                    defaultValue="4"
                    min="0"
                    className="input-field text-center"
                  />
                  <input
                    type="number"
                    placeholder="Hard"
                    defaultValue="2"
                    min="0"
                    className="input-field text-center"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Easy / Medium / Hard</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 px-6 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStart}
                className="flex-1 btn-gradient"
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
