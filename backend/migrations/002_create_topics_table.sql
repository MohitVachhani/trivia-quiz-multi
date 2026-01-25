-- Set search path
SET search_path TO trivia, public;

-- Create topics table
CREATE TABLE IF NOT EXISTS trivia.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_topics_slug ON trivia.topics(slug);
CREATE INDEX IF NOT EXISTS idx_topics_is_available ON trivia.topics(is_available);
