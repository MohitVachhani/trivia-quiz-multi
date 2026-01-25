-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create trivia schema
CREATE SCHEMA IF NOT EXISTS trivia;

-- Set search path to include trivia schema
SET search_path TO trivia, public;

-- Grant privileges (adjust based on your user)
GRANT ALL ON SCHEMA trivia TO neondb_owner;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA trivia TO neondb_owner;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA trivia TO neondb_owner;
