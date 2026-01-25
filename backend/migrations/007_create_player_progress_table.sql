-- Set search path
SET search_path TO trivia, public;

-- Create player_progress table
CREATE TABLE IF NOT EXISTS trivia.player_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES trivia.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES trivia.users(id) ON DELETE CASCADE,
  current_question_index INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_player_progress_game_id ON trivia.player_progress(game_id);
CREATE INDEX IF NOT EXISTS idx_player_progress_user_id ON trivia.player_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_player_progress_score ON trivia.player_progress(game_id, score DESC);
