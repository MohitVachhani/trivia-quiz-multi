-- Set search path
SET search_path TO trivia, public;

-- Create answer_submissions table
CREATE TABLE IF NOT EXISTS trivia.answer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES trivia.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES trivia.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES trivia.questions(id) ON DELETE RESTRICT,
  answer_ids TEXT[] NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_remaining INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, user_id, question_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_answer_submissions_game_id ON trivia.answer_submissions(game_id);
CREATE INDEX IF NOT EXISTS idx_answer_submissions_user_id ON trivia.answer_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_submissions_question_id ON trivia.answer_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_submissions_game_user_question ON trivia.answer_submissions(game_id, user_id, question_id);
