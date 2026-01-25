-- Set search path
SET search_path TO trivia, public;

-- Create lobbies table (note: games table must be created first for the foreign key reference)
-- We'll add the game_id foreign key in a later migration after games table is created
CREATE TABLE IF NOT EXISTS trivia.lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES trivia.users(id) ON DELETE CASCADE,
  topic_ids UUID[] NOT NULL,
  player_ids UUID[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'in_progress', 'completed')),
  max_players INTEGER DEFAULT 10,
  question_count INTEGER DEFAULT 10,
  difficulty JSONB DEFAULT '{"easy": 4, "medium": 4, "hard": 2}'::jsonb,
  game_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lobbies_code ON trivia.lobbies(code);
CREATE INDEX IF NOT EXISTS idx_lobbies_owner_id ON trivia.lobbies(owner_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON trivia.lobbies(status);
CREATE INDEX IF NOT EXISTS idx_lobbies_expires_at ON trivia.lobbies(expires_at);
CREATE INDEX IF NOT EXISTS idx_lobbies_archived_at ON trivia.lobbies(archived_at) WHERE archived_at IS NOT NULL;
