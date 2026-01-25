-- Set search path
SET search_path TO trivia, public;

-- Create games table
CREATE TABLE IF NOT EXISTS trivia.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES trivia.lobbies(id) ON DELETE CASCADE,
  topic_ids UUID[] NOT NULL,
  player_ids UUID[] NOT NULL,
  question_ids UUID[] NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  total_questions INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_games_lobby_id ON trivia.games(lobby_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON trivia.games(status);
CREATE INDEX IF NOT EXISTS idx_games_started_at ON trivia.games(started_at);

-- Now add the foreign key constraint to lobbies table
ALTER TABLE trivia.lobbies
DROP CONSTRAINT IF EXISTS fk_lobbies_game_id;

ALTER TABLE trivia.lobbies
ADD CONSTRAINT fk_lobbies_game_id
FOREIGN KEY (game_id) REFERENCES trivia.games(id) ON DELETE SET NULL;
