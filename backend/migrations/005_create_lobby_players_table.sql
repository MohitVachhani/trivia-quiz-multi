-- Set search path
SET search_path TO trivia, public;

-- Create lobby_players junction table
CREATE TABLE IF NOT EXISTS trivia.lobby_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES trivia.lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES trivia.users(id) ON DELETE CASCADE,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lobby_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby_id ON trivia.lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_user_id ON trivia.lobby_players(user_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_is_ready ON trivia.lobby_players(lobby_id, is_ready);
