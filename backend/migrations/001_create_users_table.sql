-- Set search path
SET search_path TO trivia, public;

-- Create users table
CREATE TABLE IF NOT EXISTS trivia.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  games_played INTEGER DEFAULT 0,
  victories INTEGER DEFAULT 0,
  time_played INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON trivia.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON trivia.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON trivia.users(total_points DESC);
