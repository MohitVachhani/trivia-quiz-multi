# Trivia Quest - PostgreSQL Database Schema

## Overview
This document outlines the complete database schema for the Trivia Quest application using PostgreSQL.

---

## Tables

### 1. users
Stores user account information and authentication credentials.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Columns:**
- `id` - Unique identifier (UUID)
- `email` - User's email address (unique)
- `password_hash` - Bcrypt hashed password
- `created_at` - Account creation timestamp
- `updated_at` - Last profile update timestamp
- `last_login_at` - Last login timestamp
- `is_active` - Soft delete flag

---

### 2. topics
Stores quiz topics/categories.

```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_topics_slug ON topics(slug);
CREATE INDEX idx_topics_is_available ON topics(is_available);
```

**Columns:**
- `id` - Unique identifier
- `slug` - URL-friendly identifier (e.g., "the_office")
- `name` - Display name (e.g., "The Office")
- `description` - Topic description
- `icon_url` - Optional icon image URL
- `is_available` - Whether topic is active
- `question_count` - Cached count of questions
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Sample Data:**
```sql
INSERT INTO topics (slug, name, description, is_available, question_count) VALUES
('the_office', 'The Office', 'Questions about the hit TV series The Office', true, 500),
('friends', 'Friends', 'Coming soon', false, 0);
```

---

### 3. questions
Stores quiz questions with their options and correct answers.

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option VARCHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  time_limit INTEGER DEFAULT 30,
  times_asked INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_questions_topic_id ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_is_active ON questions(is_active);
CREATE INDEX idx_questions_topic_difficulty ON questions(topic_id, difficulty, is_active);
```

**Columns:**
- `id` - Unique identifier
- `topic_id` - Foreign key to topics
- `difficulty` - easy/medium/hard
- `question_text` - The actual question
- `option_a/b/c/d` - Four answer options
- `correct_option` - Correct answer (A/B/C/D)
- `explanation` - Optional explanation of correct answer
- `time_limit` - Time limit in seconds (default 30)
- `times_asked` - Statistics: how many times asked
- `times_correct` - Statistics: how many times answered correctly
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `is_active` - Whether question is active

**Sample Data:**
```sql
INSERT INTO questions (topic_id, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
VALUES (
  (SELECT id FROM topics WHERE slug = 'the_office'),
  'easy',
  'What is the name of the paper company where the main characters work?',
  'Dunder Mifflin',
  'Staples',
  'Wernham Hogg',
  'Michael Scott Paper Company',
  'A',
  'The show is set at Dunder Mifflin Paper Company in Scranton, PA.'
);
```

---

### 4. lobbies
Stores game lobbies/rooms where players gather before a game starts.

```sql
CREATE TABLE lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'in_progress', 'completed')),
  max_players INTEGER DEFAULT 10,
  question_count INTEGER DEFAULT 10,
  difficulty_easy INTEGER DEFAULT 4,
  difficulty_medium INTEGER DEFAULT 4,
  difficulty_hard INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour')
);

CREATE INDEX idx_lobbies_code ON lobbies(code);
CREATE INDEX idx_lobbies_owner_id ON lobbies(owner_id);
CREATE INDEX idx_lobbies_status ON lobbies(status);
CREATE INDEX idx_lobbies_expires_at ON lobbies(expires_at);
```

**Columns:**
- `id` - Unique identifier
- `code` - Human-readable invite code (e.g., "TRIVIA-2024")
- `owner_id` - User who created the lobby
- `topic_id` - Selected quiz topic
- `status` - waiting/starting/in_progress/completed
- `max_players` - Maximum number of players
- `question_count` - Number of questions in game
- `difficulty_easy/medium/hard` - Distribution of question difficulties
- `created_at` - Lobby creation timestamp
- `started_at` - When game started (null if not started)
- `expires_at` - Automatic cleanup time

---

### 5. lobby_players
Junction table connecting users to lobbies with their ready status.

```sql
CREATE TABLE lobby_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lobby_id, user_id)
);

CREATE INDEX idx_lobby_players_lobby_id ON lobby_players(lobby_id);
CREATE INDEX idx_lobby_players_user_id ON lobby_players(user_id);
CREATE INDEX idx_lobby_players_is_ready ON lobby_players(lobby_id, is_ready);
```

**Columns:**
- `id` - Unique identifier
- `lobby_id` - Foreign key to lobbies
- `user_id` - Foreign key to users
- `is_ready` - Whether player marked themselves as ready
- `joined_at` - When player joined the lobby

---

### 6. games
Stores active and completed games.

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_question_index INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  question_ids UUID[] NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_games_lobby_id ON games(lobby_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_started_at ON games(started_at);
```

**Columns:**
- `id` - Unique identifier
- `lobby_id` - Foreign key to originating lobby
- `topic_id` - Quiz topic for this game
- `status` - in_progress/completed
- `current_question_index` - Current question number (0-based)
- `total_questions` - Total number of questions
- `question_ids` - Array of question IDs (pre-selected, random order)
- `started_at` - Game start timestamp
- `completed_at` - Game completion timestamp
- `winner_id` - ID of winning player (set when game completes)

---

### 7. game_players
Junction table connecting users to games with their scores.

```sql
CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, user_id)
);

CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_game_players_user_id ON game_players(user_id);
CREATE INDEX idx_game_players_score ON game_players(game_id, score DESC);
```

**Columns:**
- `id` - Unique identifier
- `game_id` - Foreign key to games
- `user_id` - Foreign key to users
- `score` - Total points earned
- `correct_answers` - Number of correct answers
- `total_answers` - Number of questions answered
- `rank` - Final rank (1st, 2nd, etc.) - calculated at game end
- `joined_at` - When player joined the game

---

### 8. player_answers
Stores individual answer submissions for each question.

```sql
CREATE TABLE player_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  selected_option VARCHAR(1) NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  time_remaining INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, user_id, question_id)
);

CREATE INDEX idx_player_answers_game_id ON player_answers(game_id);
CREATE INDEX idx_player_answers_user_id ON player_answers(user_id);
CREATE INDEX idx_player_answers_question_id ON player_answers(question_id);
CREATE INDEX idx_player_answers_is_correct ON player_answers(is_correct);
```

**Columns:**
- `id` - Unique identifier
- `game_id` - Foreign key to games
- `user_id` - Foreign key to users
- `question_id` - Foreign key to questions
- `selected_option` - Player's answer (A/B/C/D)
- `is_correct` - Whether answer was correct
- `time_remaining` - Seconds remaining when answered
- `points_earned` - Points awarded for this answer
- `answered_at` - Timestamp of answer submission

---

### 9. user_stats (Optional - Can be computed)
Stores aggregated statistics for each user. This is optional as stats can be computed from other tables, but caching improves performance.

```sql
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  games_played INTEGER DEFAULT 0,
  victories INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  time_played_seconds INTEGER DEFAULT 0,
  average_score DECIMAL(10, 2) DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_stats_victories ON user_stats(victories DESC);
CREATE INDEX idx_user_stats_total_points ON user_stats(total_points DESC);
```

**Columns:**
- `user_id` - Foreign key to users (primary key)
- `games_played` - Total games played
- `victories` - Number of 1st place finishes
- `total_points` - Lifetime points earned
- `total_correct_answers` - Lifetime correct answers
- `total_questions_answered` - Lifetime questions answered
- `time_played_seconds` - Total time spent playing
- `average_score` - Average score per game
- `last_updated_at` - Last statistics update

---

## Materialized Views (Optional)

### Global Leaderboard
```sql
CREATE MATERIALIZED VIEW global_leaderboard AS
SELECT
  u.id,
  u.email,
  us.games_played,
  us.victories,
  us.total_points,
  us.average_score,
  ROW_NUMBER() OVER (ORDER BY us.total_points DESC) as rank
FROM users u
JOIN user_stats us ON u.id = us.user_id
WHERE u.is_active = true
ORDER BY us.total_points DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_global_leaderboard_id ON global_leaderboard(id);
```

Refresh periodically:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY global_leaderboard;
```

---

## Triggers

### 1. Update users.updated_at on modification
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Auto-generate lobby code
```sql
CREATE OR REPLACE FUNCTION generate_lobby_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'TRIVIA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_lobby_code_trigger BEFORE INSERT ON lobbies
  FOR EACH ROW EXECUTE FUNCTION generate_lobby_code();
```

### 3. Update topic question count
```sql
CREATE OR REPLACE FUNCTION update_topic_question_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE topics
  SET question_count = (
    SELECT COUNT(*) FROM questions WHERE topic_id = NEW.topic_id AND is_active = true
  )
  WHERE id = NEW.topic_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_topic_count_on_insert AFTER INSERT ON questions
  FOR EACH ROW EXECUTE FUNCTION update_topic_question_count();

CREATE TRIGGER update_topic_count_on_update AFTER UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_topic_question_count();
```

---

## Indexes Summary

**Critical for Performance:**
- User email lookups: `idx_users_email`
- Lobby code lookups: `idx_lobbies_code`
- Game player score ordering: `idx_game_players_score`
- Question selection by topic/difficulty: `idx_questions_topic_difficulty`

---

## Data Relationships

```
users (1) ──── (N) lobby_players (N) ──── (1) lobbies
  │                                           │
  │                                           │
  │                                      (1) games (N)
  │                                           │
  └────── (N) game_players ──────────────────┘
              │
              │
              └────── (N) player_answers (N) ──── (1) questions (N) ──── (1) topics
```

---

## Initial Setup Script

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all tables in order
-- (Copy all CREATE TABLE statements from above)

-- Create indexes
-- (Copy all CREATE INDEX statements from above)

-- Create triggers
-- (Copy all trigger statements from above)

-- Insert sample topics
INSERT INTO topics (slug, name, description, is_available, question_count) VALUES
('the_office', 'The Office', 'Questions about the hit TV series The Office', true, 0),
('friends', 'Friends', 'Questions about the TV series Friends', false, 0),
('general_knowledge', 'General Knowledge', 'General trivia questions', false, 0);
```

---

## Cleanup/Maintenance Queries

### Delete expired lobbies
```sql
DELETE FROM lobbies
WHERE status = 'waiting'
AND expires_at < CURRENT_TIMESTAMP;
```

### Clean up old completed games (keep last 30 days)
```sql
DELETE FROM games
WHERE status = 'completed'
AND completed_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
```

### Recalculate user stats
```sql
UPDATE user_stats us
SET
  games_played = (SELECT COUNT(*) FROM game_players WHERE user_id = us.user_id),
  victories = (SELECT COUNT(*) FROM game_players WHERE user_id = us.user_id AND rank = 1),
  total_points = (SELECT COALESCE(SUM(score), 0) FROM game_players WHERE user_id = us.user_id),
  total_correct_answers = (SELECT COALESCE(SUM(correct_answers), 0) FROM game_players WHERE user_id = us.user_id),
  average_score = (SELECT COALESCE(AVG(score), 0) FROM game_players WHERE user_id = us.user_id);
```

---

## Notes

1. **UUIDs**: Using UUIDs for all primary keys for better distribution and security
2. **Soft Deletes**: Using `is_active` flags where appropriate instead of hard deletes
3. **Timestamps**: All tables have appropriate timestamp columns with timezone support
4. **Constraints**: Using CHECK constraints for enum-like fields
5. **Cascading**: Proper ON DELETE CASCADE/RESTRICT/SET NULL for referential integrity
6. **Performance**: Strategic indexes on foreign keys and frequently queried columns
7. **Question Randomization**: Pre-select and store question IDs in games.question_ids array
8. **Lobby Expiration**: Automatic cleanup after 1 hour to prevent database bloat

---

## Backup Recommendations

```bash
# Daily backup
pg_dump -h localhost -U postgres trivia_quest > backup_$(date +%Y%m%d).sql

# Backup with compression
pg_dump -h localhost -U postgres trivia_quest | gzip > backup_$(date +%Y%m%d).sql.gz
```
