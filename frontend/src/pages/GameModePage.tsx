import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Trophy, Clock, User, Users, Globe } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function GameModePage() {
  const navigate = useNavigate();
  const { user, logout } = useStore();

  const stats = [
    {
      icon: Zap,
      value: user?.stats.gamesPlayed || 0,
      label: 'Games Played',
      color: 'text-yellow-500',
    },
    {
      icon: Trophy,
      value: user?.stats.victories || 0,
      label: 'Victories',
      color: 'text-purple-500',
    },
    {
      icon: Clock,
      value: user?.stats.timePlayed || '0h',
      label: 'Time Played',
      color: 'text-blue-500',
    },
  ];

  const gameModes = [
    {
      id: 'single',
      title: 'Single Player',
      description: 'Practice at your own pace',
      icon: User,
      features: ['Unlimited time', 'Track your progress', 'All topics available'],
      available: true,
      onClick: () => {
        // TODO: Navigate to single player mode (future feature)
        alert('Single player mode coming soon!');
      },
    },
    {
      id: 'multi',
      title: 'Multiplayer',
      description: 'Challenge friends with invite codes',
      icon: Users,
      features: ['Create or join lobbies', 'Real-time competition', 'Live leaderboard'],
      available: true,
      onClick: () => navigate('/multiplayer'),
    },
    {
      id: 'online',
      title: 'Play Online',
      description: 'Match with random players worldwide',
      icon: Globe,
      features: ['Ranked matches', 'Global leaderboards', 'Seasonal rewards'],
      available: false,
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="p-2 hover:bg-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Select Game Mode</h1>
              <p className="text-gray-500 mt-1">Choose how you want to play</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card p-6 flex flex-col items-center text-center"
            >
              <stat.icon className={`w-8 h-8 ${stat.color} mb-3`} strokeWidth={2} />
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gameModes.map((mode) => (
            <button
              key={mode.id}
              onClick={mode.onClick}
              disabled={!mode.available}
              className={`glass-card p-6 text-left transition-all hover:shadow-2xl ${
                mode.available
                  ? 'hover:scale-[1.02] cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Coming Soon Badge */}
              {!mode.available && (
                <div className="flex justify-end mb-2">
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4">
                <mode.icon className="w-8 h-8 text-white" strokeWidth={2} />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{mode.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{mode.description}</p>

              {/* Features */}
              <ul className="space-y-2">
                {mode.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      mode.available ? 'bg-primary-500' : 'bg-gray-400'
                    }`} />
                    <span className={mode.available ? 'text-gray-700' : 'text-gray-500'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
