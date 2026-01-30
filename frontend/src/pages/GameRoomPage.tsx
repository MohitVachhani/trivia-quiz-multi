import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Crown, Play, LogOut, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { lobbyAPI } from '../services/api';
import { socketService } from '../services/socket';

export default function GameRoomPage() {
  const navigate = useNavigate();
  const {
    currentLobby,
    user,
    setCurrentLobby,
    setError,
    error,
    setIsLoading,
    isLoading,
    updateLobbyPlayers,
    updatePlayerReady,
  } = useStore();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentLobby) {
      navigate('/multiplayer');
      return;
    }

    // Join the lobby via socket
    if (socketService.isConnected()) {
      socketService.joinLobby(currentLobby.id);
    }

    // Set up socket listeners for lobby events
    const handlePlayerJoined = ({ players }: { players: any[] }) => {
      updateLobbyPlayers(players);
    };

    const handlePlayerReadyChanged = ({ playerId, isReady }: { playerId: string; isReady: boolean }) => {
      updatePlayerReady(playerId, isReady);
    };

    const handlePlayerLeft = ({ players }: { players: any[] }) => {
      updateLobbyPlayers(players);
    };

    const handleGameStarting = () => {
      // Navigate to quiz page
      navigate('/quiz');
    };

    socketService.onLobbyPlayerJoined(handlePlayerJoined);
    socketService.onLobbyPlayerReadyChanged(handlePlayerReadyChanged);
    socketService.onLobbyPlayerLeft(handlePlayerLeft);
    socketService.onLobbyGameStarting(handleGameStarting);

    // Cleanup on unmount
    return () => {
      socketService.offLobbyPlayerJoined(handlePlayerJoined);
      socketService.offLobbyPlayerReadyChanged(handlePlayerReadyChanged);
      socketService.offLobbyPlayerLeft(handlePlayerLeft);
      socketService.offLobbyGameStarting(handleGameStarting);
    };
  }, [currentLobby, navigate, updateLobbyPlayers, updatePlayerReady]);

  if (!currentLobby || !user) {
    navigate('/multiplayer');
    return null;
  }

  const currentPlayer = currentLobby.players.find((p) => p.id === user.id);
  const isOwner = currentPlayer?.isOwner || false;
  const readyCount = currentLobby.players.filter((p) => p.isReady).length;
  const canStartGame = isOwner && readyCount === currentLobby.players.length && currentLobby.players.length >= 2;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentLobby.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
    if (!currentPlayer) return;

    try {
      const newReadyState = !currentPlayer.isReady;
      
      // Update locally first for better UX
      updatePlayerReady(user.id, newReadyState);
      
      // Send to server via socket
      if (socketService.isConnected()) {
        socketService.setLobbyReady(currentLobby.id, newReadyState);
      }
      
      // Also send to REST API for persistence
      await lobbyAPI.setReady(currentLobby.id, newReadyState);
    } catch (err) {
      console.error('Failed to update ready status:', err);
      setError('Failed to update ready status');
      // Revert local change
      updatePlayerReady(user.id, !currentPlayer.isReady);
    }
  };

  const handleStartGame = async () => {
    if (!canStartGame) return;

    setIsLoading(true);
    setError(null);

    try {
      await lobbyAPI.start(currentLobby.id);
      // The game start will be handled by socket event
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start game';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveLobby = async () => {
    try {
      await lobbyAPI.leave(currentLobby.id);
      setCurrentLobby(null);
      navigate('/multiplayer');
    } catch (err) {
      console.error('Failed to leave lobby:', err);
      // Navigate anyway
      setCurrentLobby(null);
      navigate('/multiplayer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleLeaveLobby}
            className="p-2 hover:bg-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Game Room</h1>
            <p className="text-gray-500 mt-1">
              {currentLobby.status === 'waiting' ? 'Waiting for players...' : 'Game starting...'}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Room Code Card */}
        <div className="glass-card p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Room Code</p>
            <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
              {currentLobby.code}
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

        {/* Game Settings Info */}
        <div className="glass-card p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Game Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Questions</p>
              <p className="font-semibold text-gray-900">{currentLobby.questionCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Max Players</p>
              <p className="font-semibold text-gray-900">{currentLobby.maxPlayers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Easy</p>
              <p className="font-semibold text-gray-900">{currentLobby.difficulty.easy}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Medium</p>
              <p className="font-semibold text-gray-900">{currentLobby.difficulty.medium}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hard</p>
              <p className="font-semibold text-gray-900">{currentLobby.difficulty.hard}</p>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Players ({currentLobby.players.length}/{currentLobby.maxPlayers})
            </h2>
            <p className="text-sm">
              <span className="text-green-600 font-semibold">{readyCount} Ready</span>
              <span className="text-gray-400"> / {currentLobby.players.length}</span>
            </p>
          </div>

          <div className="space-y-3">
            {currentLobby.players.map((player) => {
              const isCurrentUser = player.id === user.id;
              const playerName = player.email.split('@')[0];

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
        <div className="flex gap-3">
          <button
            onClick={handleLeaveLobby}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Leave
          </button>
          
          <div className="flex-1">
            {isOwner ? (
              <button
                onClick={handleStartGame}
                disabled={!canStartGame || isLoading}
                className="btn-gradient w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                {isLoading ? 'Starting...' : 'Start Game'}
                {!canStartGame && !isLoading && (
                  <span className="text-sm">
                    ({readyCount < currentLobby.players.length ? 'Wait for all players' : 'Need at least 2 players'})
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={handleToggleReady}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  currentPlayer?.isReady
                    ? 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                    : 'btn-gradient'
                }`}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                {currentPlayer?.isReady ? 'Mark as Not Ready' : 'Mark as Ready'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}