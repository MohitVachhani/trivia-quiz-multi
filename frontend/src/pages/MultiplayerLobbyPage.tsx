import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, AlertCircle, Minus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { lobbyAPI, topicsAPI, type Topic, type LobbyCreateRequest } from '../services/api';

type Tab = 'join' | 'create';

export default function MultiplayerLobbyPage() {
  const navigate = useNavigate();
  const { setCurrentLobby, setError, error, setIsLoading, isLoading } = useStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('join');
  const [inviteCode, setInviteCode] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  // Lobby settings
  const [questionCount, setQuestionCount] = useState(10);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [difficulty, setDifficulty] = useState({
    easy: 4,
    medium: 4,
    hard: 2,
  });

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const topicsData = await topicsAPI.getTopics();
        setTopics(topicsData);
        if (topicsData.length > 0) {
          setSelectedTopics([topicsData[0].id]); // Select first topic by default
        }
      } catch (err) {
        console.error('Failed to fetch topics:', err);
        setError('Failed to load topics');
      }
    };

    fetchTopics();
  }, [setError]);

  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const lobbyResponse = await lobbyAPI.join(inviteCode.trim());
      const lobby = {
        ...lobbyResponse,
        settings: {
          topicIds: lobbyResponse.topicIds,
          questionCount: lobbyResponse.questionCount,
          difficulty: lobbyResponse.difficulty,
          maxPlayers: lobbyResponse.maxPlayers,
        },
      };
      setCurrentLobby(lobby);
      navigate('/game-room');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join lobby';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLobby = async () => {
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lobbyData: LobbyCreateRequest = {
        topicIds: selectedTopics,
        questionCount,
        difficulty,
        maxPlayers,
      };

      const lobbyResponse = await lobbyAPI.create(lobbyData);
      const lobby = {
        ...lobbyResponse,
        settings: {
          topicIds: lobbyResponse.topicIds,
          questionCount: lobbyResponse.questionCount,
          difficulty: lobbyResponse.difficulty,
          maxPlayers: lobbyResponse.maxPlayers,
        },
      };
      setCurrentLobby(lobby);
      navigate('/game-room');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lobby';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const adjustDifficulty = (type: 'easy' | 'medium' | 'hard', change: number) => {
    const newValue = difficulty[type] + change;
    const total = Object.values(difficulty).reduce((sum, val) => sum + val, 0) - difficulty[type] + newValue;
    
    if (newValue >= 0 && total <= questionCount) {
      setDifficulty(prev => ({
        ...prev,
        [type]: newValue,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
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

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => {
              setActiveTab('join');
              setError(null);
            }}
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
            onClick={() => {
              setActiveTab('create');
              setError(null);
            }}
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
                  placeholder="E.G., TRIVIA-ABC123"
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
          <div className="space-y-6">
            {/* Topics Selection */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Select Topics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicToggle(topic.id)}
                    className={`p-4 rounded-lg text-left transition-all border-2 ${
                      selectedTopics.includes(topic.id)
                        ? 'border-primary-500 bg-primary-50 text-primary-900'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">{topic.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{topic.description}</div>
                    <div className="text-xs text-gray-500 mt-2">{topic.questionsCount} questions</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Game Settings */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Game Settings</h3>
              
              <div className="space-y-6">
                {/* Question Count */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Number of Questions: {questionCount}
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5</span>
                    <span>20</span>
                  </div>
                </div>

                {/* Max Players */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Max Players: {maxPlayers}
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2</span>
                    <span>10</span>
                  </div>
                </div>

                {/* Difficulty Distribution */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Difficulty Distribution (Total: {Object.values(difficulty).reduce((a, b) => a + b, 0)}/{questionCount})
                  </label>
                  <div className="space-y-3">
                    {Object.entries(difficulty).map(([level, count]) => (
                      <div key={level} className="flex items-center justify-between">
                        <span className="capitalize text-sm font-medium text-gray-700">
                          {level}: {count} questions
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => adjustDifficulty(level as 'easy' | 'medium' | 'hard', -1)}
                            disabled={count <= 0}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-mono">{count}</span>
                          <button
                            type="button"
                            onClick={() => adjustDifficulty(level as 'easy' | 'medium' | 'hard', 1)}
                            disabled={Object.values(difficulty).reduce((a, b) => a + b, 0) >= questionCount}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateLobby}
              disabled={isLoading || selectedTopics.length === 0}
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