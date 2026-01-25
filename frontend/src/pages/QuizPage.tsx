import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, AlertCircle } from 'lucide-react';

// Mock data
const MOCK_QUESTION = {
  id: 'q_1',
  questionNumber: 1,
  totalQuestions: 10,
  difficulty: 'easy' as const,
  text: 'What is the name of the paper company where the main characters work?',
  options: [
    { id: 'opt_a', label: 'A', text: 'Dunder Mifflin' },
    { id: 'opt_b', label: 'B', text: 'Staples' },
    { id: 'opt_c', label: 'C', text: 'Wernham Hogg' },
    { id: 'opt_d', label: 'D', text: 'Michael Scott Paper Company' },
  ],
  timeLimit: 30,
};

const MOCK_LEADERBOARD = [
  { rank: 1, playerId: 'user_2', playerName: 'Michael Scott', score: 1500 },
  { rank: 2, playerId: 'user_4', playerName: 'Dwight Schrute', score: 1450 },
  { rank: 3, playerId: 'user_3', playerName: 'Jim Halpert', score: 1350 },
  { rank: 4, playerId: 'user_1', playerName: 'You (You)', score: 1200 },
];

export default function QuizPage() {
  const navigate = useNavigate();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(MOCK_QUESTION.timeLimit);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    if (timeRemaining === 0) {
      setTimeUp(true);
      setIsAnswered(true);
      // Reveal correct answer after time is up
      setCorrectAnswer('opt_a');
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleAnswerSelect = (answerId: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answerId);
  };

  const handleNextQuestion = () => {
    // TODO: Load next question or navigate to results
    // For now, go to results after first question
    navigate('/results');
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
    if (!isAnswered) {
      return selectedAnswer === optionId
        ? 'border-primary-500 bg-primary-50 shadow-md'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm';
    }

    // After answering
    if (correctAnswer === optionId) {
      return 'border-green-500 bg-green-500 text-white';
    }
    if (selectedAnswer === optionId && selectedAnswer !== correctAnswer) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200 bg-gray-50 opacity-50';
  };

  const progress = (MOCK_QUESTION.questionNumber / MOCK_QUESTION.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quiz Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">The Office Trivia</p>
                  <h2 className="text-xl font-bold text-gray-900">
                    Question {MOCK_QUESTION.questionNumber} of {MOCK_QUESTION.totalQuestions}
                  </h2>
                </div>
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    timeRemaining <= 5 ? 'bg-red-100' : 'bg-blue-100'
                  }`}
                >
                  <Clock
                    className={`w-5 h-5 ${
                      timeRemaining <= 5 ? 'text-red-600' : 'text-blue-600'
                    }`}
                  />
                  <span
                    className={`font-bold ${
                      timeRemaining <= 5 ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    {timeRemaining}s
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
                    MOCK_QUESTION.difficulty
                  )}`}
                >
                  {MOCK_QUESTION.difficulty.charAt(0).toUpperCase() +
                    MOCK_QUESTION.difficulty.slice(1)}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                {MOCK_QUESTION.text}
              </h3>

              {/* Options */}
              <div className="space-y-4">
                {MOCK_QUESTION.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    disabled={isAnswered}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${getAnswerStyles(
                      option.id
                    )} ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                          isAnswered && correctAnswer === option.id
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

              {/* Time's Up Message */}
              {timeUp && (
                <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-red-900 font-semibold">Time's up!</p>
                    <p className="text-red-700 text-sm">
                      The correct answer was: {MOCK_QUESTION.options.find(o => o.id === correctAnswer)?.text}
                    </p>
                  </div>
                </div>
              )}

              {/* Next Button */}
              {isAnswered && (
                <button
                  onClick={handleNextQuestion}
                  className="btn-gradient w-full mt-6"
                >
                  Next Question
                </button>
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
                {MOCK_LEADERBOARD.map((entry) => (
                  <div
                    key={entry.playerId}
                    className={`p-4 rounded-xl ${
                      entry.playerName.includes('You')
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
                              entry.playerName.includes('You')
                                ? 'text-primary-700'
                                : 'text-gray-900'
                            }`}
                          >
                            {entry.playerName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {entry.score.toLocaleString()}
                        </p>
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
