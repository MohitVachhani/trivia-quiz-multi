-- Set search path
SET search_path TO trivia, public;

-- Rename column from game_id to current_game_id for clarity
ALTER TABLE trivia.lobbies
RENAME COLUMN game_id TO current_game_id;

-- Update comment to reflect the one-to-many relationship
COMMENT ON COLUMN trivia.lobbies.current_game_id IS
  'References the currently active game. Lobby can have multiple historical games via games.lobby_id';
