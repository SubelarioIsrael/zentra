-- Zentra sample seed data (content only)
-- Note: This seed intentionally does NOT insert into users.

BEGIN;

-- Subjects
INSERT INTO subjects (name, description)
VALUES
	('Mathematics', 'Core math drills for algebra, geometry, and statistics.'),
	('Science', 'Foundational science review questions.'),
	('English', 'Grammar and reading comprehension practice.')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

-- Topics
WITH topic_seed(subject_name, topic_name, topic_description) AS (
	VALUES
		('Mathematics', 'Algebra', 'Linear equations, expressions, and simplification.'),
		('Mathematics', 'Geometry', 'Angles, polygons, and area/perimeter concepts.'),
		('Science', 'Biology', 'Cells, organs, and living systems.'),
		('Science', 'Physics', 'Motion, force, and energy concepts.'),
		('English', 'Grammar', 'Sentence structure, punctuation, and usage.'),
		('English', 'Reading Comprehension', 'Short-passage understanding and inference.')
)
INSERT INTO topics (subject_id, name, description)
SELECT s.id, ts.topic_name, ts.topic_description
FROM topic_seed ts
JOIN subjects s ON s.name = ts.subject_name
ON CONFLICT (subject_id, name) DO UPDATE
SET description = EXCLUDED.description;

-- Questions
WITH question_seed AS (
	SELECT
		t.id AS topic_id,
		q.prompt,
		q.option_a,
		q.option_b,
		q.option_c,
		q.option_d,
		q.correct_option,
		q.explanation,
		q.hint
	FROM (
		VALUES
			('Algebra', 'Solve: 3x + 5 = 20', 'x = 3', 'x = 5', 'x = 7', 'x = 10', 'B', 'Subtract 5 from both sides, then divide by 3.', 'Isolate x step by step.'),
			('Algebra', 'Simplify: 2(a + 4) - 3a', '-a + 8', 'a + 8', '-a - 8', '5a + 8', 'A', 'Distribute 2, then combine like terms: 2a + 8 - 3a.', 'Distribute first.'),
			('Geometry', 'How many degrees are in a right angle?', '45', '60', '90', '180', 'C', 'A right angle measures exactly 90 degrees.', 'Think of the corner of a square.'),
			('Geometry', 'Area of a rectangle with length 8 and width 3?', '11', '16', '24', '32', 'C', 'Area = length × width.', 'Use the area formula.'),
			('Biology', 'Which organelle is known as the powerhouse of the cell?', 'Nucleus', 'Mitochondrion', 'Ribosome', 'Golgi apparatus', 'B', 'Mitochondria generate ATP for cellular energy.', 'It produces ATP.'),
			('Biology', 'What is the basic unit of life?', 'Atom', 'Molecule', 'Cell', 'Tissue', 'C', 'All living organisms are made of one or more cells.', 'Smallest living structure.'),
			('Physics', 'What is the SI unit of force?', 'Joule', 'Newton', 'Watt', 'Pascal', 'B', 'Force is measured in newtons (N).', 'Named after Isaac Newton.'),
			('Physics', 'If speed increases over time, the object is experiencing:', 'Acceleration', 'Friction', 'Gravity', 'Momentum loss', 'A', 'Acceleration is change in velocity over time.', 'Rate of change of velocity.'),
			('Grammar', 'Choose the correct sentence.', 'She go to school every day.', 'She goes to school every day.', 'She going to school every day.', 'She gone to school every day.', 'B', 'Singular subject “She” takes verb “goes.”', 'Check subject-verb agreement.'),
			('Grammar', 'Select the correct punctuation.', 'Lets eat, grandma.', 'Let''s eat grandma.', 'Let''s eat, grandma.', 'Lets eat grandma.', 'C', 'Comma changes meaning; apostrophe is needed in “Let''s.”', 'Comma can save lives.'),
			('Reading Comprehension', 'A passage states: "The streets were wet, and umbrellas filled the sidewalks." What is the best inference?', 'It was sunny.', 'It was raining.', 'It was windy only.', 'It was midnight.', 'B', 'Wet streets and umbrellas strongly imply rain.', 'Use contextual clues.'),
			('Reading Comprehension', 'Main idea questions usually ask for:', 'A minor detail', 'A random quote', 'The central point of the text', 'The author’s age', 'C', 'Main idea means the central message.', 'Think overall, not one detail.')
	) AS q(topic_name, prompt, option_a, option_b, option_c, option_d, correct_option, explanation, hint)
	JOIN topics t ON t.name = q.topic_name
)
INSERT INTO questions (
	topic_id,
	prompt,
	option_a,
	option_b,
	option_c,
	option_d,
	correct_option,
	explanation,
	hint,
	image_url_1,
	image_url_2
)
SELECT
	qs.topic_id,
	qs.prompt,
	qs.option_a,
	qs.option_b,
	qs.option_c,
	qs.option_d,
	qs.correct_option,
	qs.explanation,
	qs.hint,
	NULL,
	NULL
FROM question_seed qs
WHERE NOT EXISTS (
	SELECT 1
	FROM questions existing
	WHERE existing.topic_id = qs.topic_id
		AND existing.prompt = qs.prompt
);

COMMIT;
