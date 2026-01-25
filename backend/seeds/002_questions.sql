-- Set search path
SET search_path TO trivia, public;

-- Insert sample questions for "The Office" topic
INSERT INTO trivia.questions (topic_id, type, difficulty, text, options, correct_answer_ids, explanation)
VALUES
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
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
  ),
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
    'single_correct',
    'easy',
    'What is Michael Scott''s most famous catchphrase?',
    '[
      {"id": "opt_a", "label": "A", "text": "That''s what she said"},
      {"id": "opt_b", "label": "B", "text": "Bazinga"},
      {"id": "opt_c", "label": "C", "text": "How you doin?"},
      {"id": "opt_d", "label": "D", "text": "Did I do that?"}
    ]'::jsonb,
    ARRAY['opt_a'],
    'Michael Scott frequently used "That''s what she said" as an inappropriate joke throughout the series.'
  ),
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
    'single_correct',
    'medium',
    'What is the name of the annual office award show created by Michael?',
    '[
      {"id": "opt_a", "label": "A", "text": "The Dundies"},
      {"id": "opt_b", "label": "B", "text": "The Dunder Awards"},
      {"id": "opt_c", "label": "C", "text": "The Office Oscars"},
      {"id": "opt_d", "label": "D", "text": "The Scranton Awards"}
    ]'::jsonb,
    ARRAY['opt_a'],
    'The Dundies is an annual awards ceremony held at a local restaurant where Michael gives out awards to his employees.'
  ),
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
    'single_correct',
    'medium',
    'What does Jim put Dwight''s stapler in?',
    '[
      {"id": "opt_a", "label": "A", "text": "Jello"},
      {"id": "opt_b", "label": "B", "text": "Pudding"},
      {"id": "opt_c", "label": "C", "text": "A drawer"},
      {"id": "opt_d", "label": "D", "text": "The ceiling"}
    ]'::jsonb,
    ARRAY['opt_a'],
    'In one of the show''s most iconic pranks, Jim encases Dwight''s stapler in Jello.'
  ),
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
    'single_correct',
    'medium',
    'What is the name of Angela''s cat that Dwight kills?',
    '[
      {"id": "opt_a", "label": "A", "text": "Sprinkles"},
      {"id": "opt_b", "label": "B", "text": "Whiskers"},
      {"id": "opt_c", "label": "C", "text": "Fluffy"},
      {"id": "opt_d", "label": "D", "text": "Mittens"}
    ]'::jsonb,
    ARRAY['opt_a'],
    'Dwight freezes Angela''s sick cat Sprinkles, which causes a major rift in their relationship.'
  ),
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
    'single_correct',
    'hard',
    'What does Kevin wear on his feet to Jim and Pam''s wedding?',
    '[
      {"id": "opt_a", "label": "A", "text": "Tissue boxes"},
      {"id": "opt_b", "label": "B", "text": "Slippers"},
      {"id": "opt_c", "label": "C", "text": "Sandals"},
      {"id": "opt_d", "label": "D", "text": "Nothing"}
    ]'::jsonb,
    ARRAY['opt_a'],
    'Kevin cuts his feet on glass and wears tissue boxes as shoes to the wedding.'
  ),
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
    'single_correct',
    'hard',
    'What is the name of Jan''s assistant who Michael briefly dates?',
    '[
      {"id": "opt_a", "label": "A", "text": "Hunter"},
      {"id": "opt_b", "label": "B", "text": "Josh"},
      {"id": "opt_c", "label": "C", "text": "Ryan"},
      {"id": "opt_d", "label": "D", "text": "Clark"}
    ]'::jsonb,
    ARRAY['opt_a'],
    'Hunter is Jan''s young assistant who later records a song about Jan called "That One Night".'
  ),
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
    'single_correct',
    'easy',
    'What is Dwight''s job title?',
    '[
      {"id": "opt_a", "label": "A", "text": "Assistant Regional Manager"},
      {"id": "opt_b", "label": "B", "text": "Assistant to the Regional Manager"},
      {"id": "opt_c", "label": "C", "text": "Regional Manager"},
      {"id": "opt_d", "label": "D", "text": "Sales Associate"}
    ]'::jsonb,
    ARRAY['opt_b'],
    'Dwight is "Assistant to the Regional Manager", though he often tries to claim he is "Assistant Regional Manager".'
  ),
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
    'single_correct',
    'medium',
    'What does Michael grill his foot on?',
    '[
      {"id": "opt_a", "label": "A", "text": "A George Foreman Grill"},
      {"id": "opt_b", "label": "B", "text": "A panini press"},
      {"id": "opt_c", "label": "C", "text": "A waffle iron"},
      {"id": "opt_d", "label": "D", "text": "A regular stove"}
    ]'::jsonb,
    ARRAY['opt_a'],
    'Michael grills his foot on a George Foreman Grill that he keeps by his bed to wake up to the smell of bacon.'
  ),
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
    'single_correct',
    'hard',
    'What is the name of the company that buys out Dunder Mifflin?',
    '[
      {"id": "opt_a", "label": "A", "text": "Sabre"},
      {"id": "opt_b", "label": "B", "text": "Staples"},
      {"id": "opt_c", "label": "C", "text": "Athlead"},
      {"id": "opt_d", "label": "D", "text": "Vance Refrigeration"}
    ]'::jsonb,
    ARRAY['opt_a'],
    'Sabre, a printer company, buys Dunder Mifflin in Season 6.'
  ),
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
    'single_correct',
    'easy',
    'What city does the show take place in?',
    '[
      {"id": "opt_a", "label": "A", "text": "Scranton, Pennsylvania"},
      {"id": "opt_b", "label": "B", "text": "New York, New York"},
      {"id": "opt_c", "label": "C", "text": "Buffalo, New York"},
      {"id": "opt_d", "label": "D", "text": "Philadelphia, Pennsylvania"}
    ]'::jsonb,
    ARRAY['opt_a'],
    'The Office takes place in Scranton, Pennsylvania at the Dunder Mifflin branch.'
  ),
  (
    (SELECT id FROM trivia.topics WHERE slug = 'the_office'),
    'single_correct',
    'medium',
    'What vegetable does Kevin famously spill?',
    '[
      {"id": "opt_a", "label": "A", "text": "Chili"},
      {"id": "opt_b", "label": "B", "text": "Beans"},
      {"id": "opt_c", "label": "C", "text": "Soup"},
      {"id": "opt_d", "label": "D", "text": "Stew"}
    ]'::jsonb,
    ARRAY['opt_a'],
    'Kevin spills his famous chili all over the office floor in a memorable cold open. (Note: Chili is technically a dish, not a vegetable!)'
  );
