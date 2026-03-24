INSERT INTO subjects (name, description)
VALUES
  ('Mathematics', 'Foundational math concepts for exam prep.'),
  ('Science', 'Core scientific principles and reasoning.')
ON CONFLICT (name) DO NOTHING;

WITH math_subject AS (
  SELECT id FROM subjects WHERE name = 'Mathematics'
), science_subject AS (
  SELECT id FROM subjects WHERE name = 'Science'
)
INSERT INTO topics (subject_id, name, description)
SELECT id, 'Algebra', 'Equations, variables, and linear functions.' FROM math_subject
UNION ALL
SELECT id, 'Geometry', 'Shapes, angles, and spatial reasoning.' FROM math_subject
UNION ALL
SELECT id, 'Biology', 'Cells, organisms, and ecosystems.' FROM science_subject
ON CONFLICT (subject_id, name) DO NOTHING;

INSERT INTO questions (topic_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation)
SELECT t.id,
       'Solve for x: 2x + 6 = 14',
       'x = 2', 'x = 3', 'x = 4', 'x = 5',
       'C',
       'Subtract 6 from both sides to get 2x = 8, then divide by 2.'
FROM topics t
WHERE t.name = 'Algebra'
  AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.prompt = 'Solve for x: 2x + 6 = 14');

INSERT INTO questions (topic_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation)
SELECT t.id,
       'What is the area of a rectangle with length 8 and width 3?',
       '11', '24', '16', '32',
       'B',
       'Area of rectangle = length × width = 8 × 3 = 24.'
FROM topics t
WHERE t.name = 'Geometry'
  AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.prompt = 'What is the area of a rectangle with length 8 and width 3?');

INSERT INTO questions (topic_id, prompt, option_a, option_b, option_c, option_d, correct_option, explanation)
SELECT t.id,
       'Which organelle is known as the powerhouse of the cell?',
       'Nucleus', 'Mitochondrion', 'Ribosome', 'Golgi apparatus',
       'B',
       'Mitochondria produce ATP, the primary energy currency of the cell.'
FROM topics t
WHERE t.name = 'Biology'
  AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.prompt = 'Which organelle is known as the powerhouse of the cell?');
