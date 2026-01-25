-- Set search path
SET search_path TO trivia, public;

-- Create questions table
CREATE TABLE IF NOT EXISTS trivia.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES trivia.topics(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'single_correct' CHECK (type IN ('single_correct', 'multi_correct', 'true_false')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer_ids TEXT[] NOT NULL,
  explanation TEXT,
  times_asked INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON trivia.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON trivia.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_type ON trivia.questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON trivia.questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_topic_difficulty ON trivia.questions(topic_id, difficulty, is_active);
