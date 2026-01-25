import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus } from 'lucide-react';

type Tab = 'join' | 'create';

export default function MultiplayerLobbyPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('join');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsLoading(true);

    // TODO: Replace with actual API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/game-room');
    }, 1000);
  };

  const handleCreateLobby = async () => {
    setIsLoading(true);

    // TODO: Replace with actual API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/game-room');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/game-mode')}
            className="p-2 hover:bg-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Multiplayer</h1>
            <p className="text-gray-500 mt-1">Join or create a game lobby</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'join'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-5 h-5" />
            Join Lobby
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Plus className="w-5 h-5" />
            Create Lobby
          </button>
        </div>

        {/* Content */}
        {activeTab === 'join' ? (
          <div className="glass-card p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-blue-500" strokeWidth={2} />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Join a Game</h2>
              <p className="text-gray-500">
                Enter the invite code shared by your friend
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleJoinLobby} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  placeholder="E.G., TRIVIA-2024"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  className="input-field text-center text-lg font-mono tracking-wider"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !inviteCode.trim()}
                className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Joining...' : 'Join Game'}
              </button>
            </form>
          </div>
        ) : (
          <div className="glass-card p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                <Plus className="w-10 h-10 text-purple-500" strokeWidth={2} />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create a Lobby</h2>
              <p className="text-gray-500">
                Start a new game and invite your friends
              </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-3 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Step 1:</span> Create your lobby and get a unique invite code
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-900">
                  <span className="font-semibold">Step 2:</span> Share the code with your friends
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  <span className="font-semibold">Step 3:</span> Configure game settings and start playing!
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateLobby}
              disabled={isLoading}
              className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Lobby'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
