import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useSocketConnection } from './hooks/useSocketConnection';
import LoginPage from './pages/LoginPage';
import GameModePage from './pages/GameModePage';
import MultiplayerLobbyPage from './pages/MultiplayerLobbyPage';
import GameRoomPage from './pages/GameRoomPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  // Initialize socket connection for authenticated users
  useSocketConnection();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/game-mode"
          element={
            <ProtectedRoute>
              <GameModePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/multiplayer"
          element={
            <ProtectedRoute>
              <MultiplayerLobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game-room"
          element={
            <ProtectedRoute>
              <GameRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;