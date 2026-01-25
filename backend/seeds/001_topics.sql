-- Set search path
SET search_path TO trivia, public;

-- Insert initial topics
INSERT INTO trivia.topics (slug, name, description, is_available) VALUES
('the_office', 'The Office', 'Questions about the hit TV series The Office', true),
('friends', 'Friends', 'Questions about the TV series Friends', false),
('general_knowledge', 'General Knowledge', 'General trivia questions', false);
