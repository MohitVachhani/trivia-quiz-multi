-- Set search path
SET search_path TO trivia, public;

-- Trigger function to auto-update updated_at column
CREATE OR REPLACE FUNCTION trivia.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON trivia.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON trivia.users
  FOR EACH ROW EXECUTE FUNCTION trivia.update_updated_at_column();

DROP TRIGGER IF EXISTS update_topics_updated_at ON trivia.topics;
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON trivia.topics
  FOR EACH ROW EXECUTE FUNCTION trivia.update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON trivia.questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON trivia.questions
  FOR EACH ROW EXECUTE FUNCTION trivia.update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_progress_updated_at ON trivia.player_progress;
CREATE TRIGGER update_player_progress_updated_at BEFORE UPDATE ON trivia.player_progress
  FOR EACH ROW EXECUTE FUNCTION trivia.update_updated_at_column();

-- Trigger function to auto-generate lobby code
CREATE OR REPLACE FUNCTION trivia.generate_lobby_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'TRIVIA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS generate_lobby_code_trigger ON trivia.lobbies;
CREATE TRIGGER generate_lobby_code_trigger BEFORE INSERT ON trivia.lobbies
  FOR EACH ROW EXECUTE FUNCTION trivia.generate_lobby_code();

-- Trigger function to sync lobby player_ids with lobby_players table
CREATE OR REPLACE FUNCTION trivia.sync_lobby_player_ids()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE trivia.lobbies
    SET player_ids = ARRAY(
      SELECT user_id FROM trivia.lobby_players WHERE lobby_id = OLD.lobby_id
    )
    WHERE id = OLD.lobby_id;
    RETURN OLD;
  ELSE
    UPDATE trivia.lobbies
    SET player_ids = ARRAY(
      SELECT user_id FROM trivia.lobby_players WHERE lobby_id = NEW.lobby_id
    )
    WHERE id = NEW.lobby_id;
    RETURN NEW;
  END IF;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS sync_lobby_players_on_insert ON trivia.lobby_players;
CREATE TRIGGER sync_lobby_players_on_insert AFTER INSERT ON trivia.lobby_players
  FOR EACH ROW EXECUTE FUNCTION trivia.sync_lobby_player_ids();

DROP TRIGGER IF EXISTS sync_lobby_players_on_delete ON trivia.lobby_players;
CREATE TRIGGER sync_lobby_players_on_delete AFTER DELETE ON trivia.lobby_players
  FOR EACH ROW EXECUTE FUNCTION trivia.sync_lobby_player_ids();
