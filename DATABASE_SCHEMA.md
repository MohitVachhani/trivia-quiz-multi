# Trivia Quest - Database Schema

## Overview
This document outlines the complete database schema for the Trivia Quest application using PostgreSQL for persistent data and Redis for real-time leaderboards.

---

## Technology Stack
- **PostgreSQL** - Primary database for persistent storage
- **Redis** - Real-time leaderboards and session management

---

## PostgreSQL Tables

### 1. users
Stores user account information, authentication credentials, and statistics.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  games_played INTEGER DEFAULT 0,
  victories INTEGER DEFAULT 0,
  time_played INTEGER DEFAULT 0, -- in seconds
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_total_points ON users(total_points DESC);
```

**Columns:**
- `id` - Unique identifier (UUID)
- `email` - User's email address (unique)
- `password_hash` - Bcrypt hashed password
- `games_played` - Total number of games played
- `victories` - Number of 1st place finishes
- `time_played` - Total time played in seconds
- `total_points` - Lifetime points earned
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
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Sample Data:**
```sql
INSERT INTO topics (slug, name, description, is_available) VALUES
('the_office', 'The Office', 'Questions about the hit TV series The Office', true),
('friends', 'Friends', 'Coming soon', false);
```

---

### 3. questions
Stores quiz questions with their options and correct answers.

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'single_correct' CHECK (type IN ('single_correct', 'multi_correct', 'true_false')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  text TEXT NOT NULL,
  options JSONB NOT NULL, -- [{id: "opt_a", label: "A", text: "..."}, ...]
  correct_answer_ids TEXT[] NOT NULL, -- Array for future multi-correct support
  explanation TEXT,
  times_asked INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_questions_topic_id ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_is_active ON questions(is_active);
CREATE INDEX idx_questions_topic_difficulty ON questions(topic_id, difficulty, is_active);
```

**Columns:**
- `id` - Unique identifier
- `topic_id` - Foreign key to topics
- `type` - Question type (single_correct, multi_correct, true_false)
- `difficulty` - easy/medium/hard
- `text` - The actual question
- `options` - JSONB array of answer options with id, label, and text
- `correct_answer_ids` - Array of correct answer IDs (supports multi-correct)
- `explanation` - Optional explanation of correct answer
- `times_asked` - Statistics: how many times asked
- `times_correct` - Statistics: how many times answered correctly
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `is_active` - Whether question is active

**Sample Data:**
```sql
INSERT INTO questions (topic_id, type, difficulty, text, options, correct_answer_ids, explanation)
VALUES (
  (SELECT id FROM topics WHERE slug = 'the_office'),
  'single_correct',
  'easy',
  'What is the name of the paper company where the main characters work?',
  '[
    {"id": "opt_a", "label": "A", "text": "Dunder Mifflin"},
    {"id": "opt_b", "label": "B", "text": "Staples"},
    {"id": "opt_c", "label": "C", "text": "Wernham Hogg"},
    {"id": "opt_d", "label": "D", "text": "Michael Scott Paper Company"}
  ]'::jsonb,
  ARRAY['opt_a'],
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
  topic_ids UUID[] NOT NULL, -- Array of topic IDs (supports multiple topics)
  player_ids UUID[] DEFAULT '{}', -- Array of user IDs in lobby
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'in_progress', 'completed')),
  max_players INTEGER DEFAULT 10,
  question_count INTEGER DEFAULT 10,
  difficulty JSONB DEFAULT '{"easy": 4, "medium": 4, "hard": 2}'::jsonb, -- Difficulty distribution
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
  archived_at TIMESTAMP WITH TIME ZONE -- For soft delete/archival
);

CREATE INDEX idx_lobbies_code ON lobbies(code);
CREATE INDEX idx_lobbies_owner_id ON lobbies(owner_id);
CREATE INDEX idx_lobbies_status ON lobbies(status);
CREATE INDEX idx_lobbies_expires_at ON lobbies(expires_at);
CREATE INDEX idx_lobbies_archived_at ON lobbies(archived_at) WHERE archived_at IS NOT NULL;
```

**Columns:**
- `id` - Unique identifier
- `code` - Human-readable invite code (e.g., "TRIVIA-2024")
- `owner_id` - User who created the lobby
- `topic_ids` - Array of selected quiz topic IDs (supports mixed topics)
- `player_ids` - Array of user IDs currently in the lobby
- `status` - waiting/starting/in_progress/completed
- `max_players` - Maximum number of players
- `question_count` - Number of questions in game
- `difficulty` - JSONB object with difficulty distribution
- `game_id` - Foreign key to game (set when game starts)
- `created_at` - Lobby creation timestamp
- `started_at` - When game started (null if not started)
- `expires_at` - Automatic cleanup time
- `archived_at` - Soft delete timestamp for completed lobbies

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
  topic_ids UUID[] NOT NULL, -- Array of topic IDs (can be multiple)
  player_ids UUID[] NOT NULL, -- Array of user IDs participating in game
  question_ids UUID[] NOT NULL, -- Ordered array of question IDs for this game
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  total_questions INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_games_lobby_id ON games(lobby_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_started_at ON games(started_at);
```

**Columns:**
- `id` - Unique identifier
- `lobby_id` - Foreign key to originating lobby
- `topic_ids` - Array of quiz topic IDs (supports mixed topic games)
- `player_ids` - Array of user IDs participating in the game
- `question_ids` - Ordered array of question IDs (pre-selected for the game)
- `status` - waiting/in_progress/completed
- `total_questions` - Total number of questions
- `started_at` - Game start timestamp
- `completed_at` - Game completion timestamp

---

### 7. player_progress
Tracks individual player progress through a game (since each player can be at different questions).

```sql
CREATE TABLE player_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_question_index INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, user_id)
);

CREATE INDEX idx_player_progress_game_id ON player_progress(game_id);
CREATE INDEX idx_player_progress_user_id ON player_progress(user_id);
CREATE INDEX idx_player_progress_score ON player_progress(game_id, score DESC);
```

**Columns:**
- `id` - Unique identifier
- `game_id` - Foreign key to games
- `user_id` - Foreign key to users
- `current_question_index` - Current question index for this player (0-based)
- `score` - Current score for this player
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### 8. answer_submissions
Stores individual answer submissions for each question.

```sql
CREATE TABLE answer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  answer_ids TEXT[] NOT NULL, -- Array to support multi-select answers
  is_correct BOOLEAN NOT NULL,
  time_remaining INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, user_id, question_id)
);

CREATE INDEX idx_answer_submissions_game_id ON answer_submissions(game_id);
CREATE INDEX idx_answer_submissions_user_id ON answer_submissions(user_id);
CREATE INDEX idx_answer_submissions_question_id ON answer_submissions(question_id);
CREATE INDEX idx_answer_submissions_game_user_question ON answer_submissions(game_id, user_id, question_id);
```

**Columns:**
- `id` - Unique identifier
- `game_id` - Foreign key to games
- `user_id` - Foreign key to users
- `question_id` - Foreign key to questions
- `answer_ids` - Array of selected answer IDs (supports multi-select)
- `is_correct` - Whether answer was correct
- `time_remaining` - Seconds remaining when answered
- `points_earned` - Points awarded for this answer
- `submitted_at` - Timestamp of answer submission

---

## Redis Data Structures

### 1. Game Leaderboards (Sorted Sets)

Redis sorted sets are used for real-time leaderboards with O(log N) performance.

**Key Pattern:** `game:{gameId}:leaderboard`

**Structure:**
- **Member**: userId (string)
- **Score**: player's total score (number)

**Commands:**

```redis
# Add/update player score
ZADD game:abc123:leaderboard 1500 user_456

# Increment player score (atomic)
ZINCRBY game:abc123:leaderboard 250 user_456

# Get top N players with scores
ZREVRANGE game:abc123:leaderboard 0 9 WITHSCORES

# Get player's rank (0-indexed)
ZREVRANK game:abc123:leaderboard user_456

# Get player's score
ZSCORE game:abc123:leaderboard user_456

# Get leaderboard size
ZCARD game:abc123:leaderboard

# Set expiry (24 hours after game completion)
EXPIRE game:abc123:leaderboard 86400
```

**Example Response:**
```
ZREVRANGE game:abc123:leaderboard 0 -1 WITHSCORES
1) "user_456"
2) "1500"
3) "user_789"
4) "1450"
5) "user_101"
6) "1350"
```

**TTL Strategy:**
- Active games: No expiry (kept until game completes)
- Completed games: 24 hour expiry after completion
- Can be extended if viewing game results

---

### 2. Lobby Session Data (Strings/Hashes)

**Key Pattern:** `lobby:{lobbyId}:session`

Used for temporary lobby state during game setup.

```redis
# Store lobby session data
HSET lobby:abc123:session owner_id user_456
HSET lobby:abc123:session ready_count 3
HSET lobby:abc123:session total_players 4

# Set expiry (1 hour)
EXPIRE lobby:abc123:session 3600

# Get all session data
HGETALL lobby:abc123:session
```

---

### 3. Active Players (Sets)

**Key Pattern:** `game:{gameId}:active_players`

Tracks which players are currently connected to a game.

```redis
# Add player to active set
SADD game:abc123:active_players user_456

# Remove player
SREM game:abc123:active_players user_456

# Get all active players
SMEMBERS game:abc123:active_players

# Check if player is active
SISMEMBER game:abc123:active_players user_456

# Get count
SCARD game:abc123:active_players
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

CREATE TRIGGER update_player_progress_updated_at BEFORE UPDATE ON player_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Auto-generate lobby code
```sql
CREATE OR REPLACE FUNCTION generate_lobby_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'TRIVIA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_lobby_code_trigger BEFORE INSERT ON lobbies
  FOR EACH ROW EXECUTE FUNCTION generate_lobby_code();
```

### 3. Sync lobby player_ids with lobby_players
```sql
CREATE OR REPLACE FUNCTION sync_lobby_player_ids()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lobbies
  SET player_ids = ARRAY(
    SELECT user_id FROM lobby_players WHERE lobby_id = NEW.lobby_id
  )
  WHERE id = NEW.lobby_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_lobby_players_on_insert AFTER INSERT ON lobby_players
  FOR EACH ROW EXECUTE FUNCTION sync_lobby_player_ids();

CREATE TRIGGER sync_lobby_players_on_delete AFTER DELETE ON lobby_players
  FOR EACH ROW EXECUTE FUNCTION sync_lobby_player_ids();
```

---

## Data Relationships

```
users (1) ──── (N) lobby_players (N) ──── (1) lobbies
  │                                           │
  │                                           │ (1:1)
  │                                      (1) games (N)
  │                                           │
  │                                           │
  └────── (N) player_progress ───────────────┘
              │
              │
              └────── (N) answer_submissions (N) ──── (1) questions (N) ──── (1) topics

Redis Leaderboard:
  game:{gameId}:leaderboard → Sorted Set (userId: score)
```

---

## Initial Setup Script

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all tables (in dependency order)
-- (Execute all CREATE TABLE statements from above)

-- Create indexes
-- (Execute all CREATE INDEX statements from above)

-- Create functions
-- (Execute all function definitions from above)

-- Create triggers
-- (Execute all trigger statements from above)

-- Insert sample topics
INSERT INTO topics (slug, name, description, is_available) VALUES
('the_office', 'The Office', 'Questions about the hit TV series The Office', true),
('friends', 'Friends', 'Questions about the TV series Friends', false),
('general_knowledge', 'General Knowledge', 'General trivia questions', false);
```

---

## Cleanup/Maintenance Queries

### Archive completed lobbies (after 7 days)
```sql
UPDATE lobbies
SET archived_at = CURRENT_TIMESTAMP
WHERE status = 'completed'
AND completed_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
AND archived_at IS NULL;
```

### Delete expired waiting lobbies
```sql
DELETE FROM lobbies
WHERE status = 'waiting'
AND expires_at < CURRENT_TIMESTAMP
AND archived_at IS NULL;
```

### Hard delete archived lobbies (after 30 days)
```sql
DELETE FROM lobbies
WHERE archived_at IS NOT NULL
AND archived_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
```

### Recalculate user stats
```sql
UPDATE users u
SET
  games_played = (
    SELECT COUNT(DISTINCT game_id)
    FROM player_progress
    WHERE user_id = u.id
  ),
  victories = (
    SELECT COUNT(*)
    FROM (
      SELECT game_id, user_id, score,
        RANK() OVER (PARTITION BY game_id ORDER BY score DESC) as rank
      FROM player_progress
    ) ranked
    WHERE ranked.user_id = u.id AND ranked.rank = 1
  ),
  total_points = (
    SELECT COALESCE(SUM(points_earned), 0)
    FROM answer_submissions
    WHERE user_id = u.id
  );
```

---

## Performance Considerations

### Critical Indexes
- **User email lookups**: `idx_users_email` - Used on every login
- **Lobby code lookups**: `idx_lobbies_code` - Used when joining lobbies
- **Player progress by game**: `idx_player_progress_game_id` - Real-time leaderboard queries
- **Answer submissions compound**: `idx_answer_submissions_game_user_question` - Prevents duplicate submissions
- **Question selection**: `idx_questions_topic_difficulty` - Efficient question selection for games

### Query Optimization Tips
1. Use `EXPLAIN ANALYZE` for slow queries
2. Keep `player_ids` arrays reasonably sized (max 10-20 players)
3. Archive completed lobbies regularly to reduce table size
4. Use Redis for real-time leaderboards instead of PostgreSQL for better performance
5. Consider partitioning `answer_submissions` table by date if volume is very high

---

## Notes

1. **UUIDs**: Using UUIDs for all primary keys for better distribution and security
2. **Soft Deletes**: Using `archived_at` for lobbies to maintain history
3. **Timestamps**: All tables have appropriate timestamp columns with timezone support
4. **Constraints**: Using CHECK constraints for enum-like fields
5. **Cascading**: Proper ON DELETE CASCADE/RESTRICT/SET NULL for referential integrity
6. **Array Fields**: Using PostgreSQL arrays for `player_ids`, `topic_ids`, `question_ids`, `answer_ids` for flexibility
7. **JSONB**: Using JSONB for structured data (options, difficulty distribution) with indexing support
8. **Redis TTL**: Automatic cleanup of stale leaderboard data
9. **Question Randomization**: Pre-select and store question IDs in `games.question_ids` array
10. **Per-Player Progress**: `player_progress` table allows asynchronous gameplay where players can be at different questions

---

## Backup Recommendations

```bash
# Daily PostgreSQL backup
pg_dump -h localhost -U postgres trivia_quest > backup_$(date +%Y%m%d).sql

# Backup with compression
pg_dump -h localhost -U postgres trivia_quest | gzip > backup_$(date +%Y%m%d).sql.gz

# Redis backup (Redis handles this automatically with RDB/AOF)
# Configure in redis.conf:
# save 900 1      # Save after 900 seconds if at least 1 key changed
# save 300 10     # Save after 300 seconds if at least 10 keys changed
# save 60 10000   # Save after 60 seconds if at least 10000 keys changed
```

---

## Environment Variables

```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/trivia_quest

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL_LEADERBOARD=86400  # 24 hours in seconds
REDIS_TTL_LOBBY_SESSION=3600 # 1 hour in seconds
```
