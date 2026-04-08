-- Test data for the dynamic respondent assessment form.
-- Safe to rerun: seeded questions/options/rules are removed before reinserting.

START TRANSACTION;

INSERT INTO sectors (name, code, description, display_order, is_active)
SELECT 'Retail', 'RETAIL', 'Retail and consumer services organizations.', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM sectors WHERE code = 'RETAIL');

INSERT INTO sectors (name, code, description, display_order, is_active)
SELECT 'Banking', 'BANKING', 'Banks and financial services organizations.', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM sectors WHERE code = 'BANKING');

INSERT INTO sectors (name, code, description, display_order, is_active)
SELECT 'Insurance', 'INSURANCE', 'Insurance carriers, brokers, and related organizations.', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM sectors WHERE code = 'INSURANCE');

INSERT INTO sectors (name, code, description, display_order, is_active)
SELECT 'Telecom', 'TELECOM', 'Telecommunications and connectivity providers.', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM sectors WHERE code = 'TELECOM');

INSERT INTO sectors (name, code, description, display_order, is_active)
SELECT 'Other', 'OTHER', 'Other industries not covered by a dedicated sector model.', 4, 1
WHERE NOT EXISTS (SELECT 1 FROM sectors WHERE code = 'OTHER');

UPDATE sectors
SET is_active = 1
WHERE code IN ('RETAIL', 'BANKING', 'INSURANCE', 'TELECOM', 'OTHER');

UPDATE dimensions
SET is_active = 1
WHERE code IN (
  'LISTENING_FEEDBACK',
  'JOURNEY_MANAGEMENT',
  'TRUST_TRANSPARENCY'
);

INSERT INTO subdimensions (
  dimension_id,
  name,
  code,
  description,
  weight,
  display_order,
  is_active
)
SELECT id, 'Feedback Collection', 'FEEDBACK_COLLECTION', 'How feedback is captured across channels.', 0.50, 0, 1
FROM dimensions
WHERE code = 'LISTENING_FEEDBACK'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  weight = VALUES(weight),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active);

INSERT INTO subdimensions (
  dimension_id,
  name,
  code,
  description,
  weight,
  display_order,
  is_active
)
SELECT id, 'Voice of Customer Actioning', 'VOC_ACTIONING', 'How insights are prioritized and translated into change.', 0.50, 1, 1
FROM dimensions
WHERE code = 'LISTENING_FEEDBACK'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  weight = VALUES(weight),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active);

INSERT INTO subdimensions (
  dimension_id,
  name,
  code,
  description,
  weight,
  display_order,
  is_active
)
SELECT id, 'Journey Mapping', 'JOURNEY_MAPPING', 'How customer journeys are documented and maintained.', 0.50, 0, 1
FROM dimensions
WHERE code = 'JOURNEY_MANAGEMENT'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  weight = VALUES(weight),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active);

INSERT INTO subdimensions (
  dimension_id,
  name,
  code,
  description,
  weight,
  display_order,
  is_active
)
SELECT id, 'Journey Orchestration', 'JOURNEY_ORCHESTRATION', 'How teams coordinate cross-channel experience improvements.', 0.50, 1, 1
FROM dimensions
WHERE code = 'JOURNEY_MANAGEMENT'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  weight = VALUES(weight),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active);

INSERT INTO subdimensions (
  dimension_id,
  name,
  code,
  description,
  weight,
  display_order,
  is_active
)
SELECT id, 'Customer Communication', 'CUSTOMER_COMMUNICATION', 'How clearly and consistently information is shared with customers.', 0.50, 0, 1
FROM dimensions
WHERE code = 'TRUST_TRANSPARENCY'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  weight = VALUES(weight),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active);

INSERT INTO subdimensions (
  dimension_id,
  name,
  code,
  description,
  weight,
  display_order,
  is_active
)
SELECT id, 'Trust Signals', 'TRUST_SIGNALS', 'How policies, commitments, and issue handling create trust.', 0.50, 1, 1
FROM dimensions
WHERE code = 'TRUST_TRANSPARENCY'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  weight = VALUES(weight),
  display_order = VALUES(display_order),
  is_active = VALUES(is_active);

DELETE qdr
FROM question_display_rules qdr
JOIN questions q ON qdr.question_id = q.id
WHERE q.helper_text IN (
  'Seed data for dynamic assessment form.',
  'Seed follow-up for dynamic assessment form.',
  'Seed optional text area for dynamic assessment form.'
);

DELETE qao
FROM question_answer_options qao
JOIN questions q ON qao.question_id = q.id
WHERE q.helper_text IN (
  'Seed data for dynamic assessment form.',
  'Seed follow-up for dynamic assessment form.',
  'Seed optional text area for dynamic assessment form.'
);

DELETE FROM questions
WHERE helper_text IN (
  'Seed data for dynamic assessment form.',
  'Seed follow-up for dynamic assessment form.',
  'Seed optional text area for dynamic assessment form.'
);

INSERT INTO questions (
  sector_id,
  subdimension_id,
  question_text,
  helper_text,
  answer_type,
  is_mandatory,
  is_scored,
  scoring_strategy,
  weight,
  display_order,
  is_active
)
SELECT
  s.id,
  sd.id,
  CASE sd.code
    WHEN 'FEEDBACK_COLLECTION' THEN CONCAT('For ', s.name, ', how systematically is customer feedback collected?')
    WHEN 'VOC_ACTIONING' THEN CONCAT('For ', s.name, ', how consistently is customer feedback translated into action?')
    WHEN 'JOURNEY_MAPPING' THEN CONCAT('For ', s.name, ', how mature is journey mapping and ownership?')
    WHEN 'JOURNEY_ORCHESTRATION' THEN CONCAT('For ', s.name, ', how well are journey improvements coordinated across teams?')
    WHEN 'CUSTOMER_COMMUNICATION' THEN CONCAT('For ', s.name, ', how clear and proactive is customer communication?')
    WHEN 'TRUST_SIGNALS' THEN CONCAT('For ', s.name, ', how effectively are trust signals managed and improved?')
  END,
  'Seed data for dynamic assessment form.',
  'single_select',
  1,
  1,
  'single_option_score',
  NULL,
  0,
  1
FROM sectors s
JOIN subdimensions sd
JOIN dimensions d ON d.id = sd.dimension_id
WHERE s.code IN ('RETAIL', 'BANKING', 'INSURANCE', 'TELECOM')
  AND sd.code IN (
    'FEEDBACK_COLLECTION',
    'VOC_ACTIONING',
    'JOURNEY_MAPPING',
    'JOURNEY_ORCHESTRATION',
    'CUSTOMER_COMMUNICATION',
    'TRUST_SIGNALS'
  );

INSERT INTO question_answer_options (
  question_id,
  option_label,
  option_value,
  score,
  maturity_level,
  display_order,
  is_active
)
SELECT
  q.id,
  scale.option_label,
  scale.option_value,
  scale.score,
  scale.maturity_level,
  scale.display_order,
  1
FROM questions q
JOIN (
  SELECT 'Not in place' AS option_label, 'not_in_place' AS option_value, 0.0000 AS score, 0 AS maturity_level, 0 AS display_order
  UNION ALL SELECT 'Ad hoc / informal', 'ad_hoc', 1.0000, 1, 1
  UNION ALL SELECT 'Defined but inconsistent', 'defined', 2.0000, 2, 2
  UNION ALL SELECT 'Managed consistently', 'managed', 3.0000, 3, 3
  UNION ALL SELECT 'Optimized', 'optimized', 4.0000, 4, 4
) scale
WHERE q.helper_text = 'Seed data for dynamic assessment form.';

INSERT INTO questions (
  sector_id,
  subdimension_id,
  question_text,
  helper_text,
  answer_type,
  is_mandatory,
  is_scored,
  scoring_strategy,
  weight,
  display_order,
  is_active
)
SELECT
  s.id,
  sd.id,
  CONCAT('What is the biggest blocker preventing ', s.name, ' from acting on customer feedback?'),
  'Seed follow-up for dynamic assessment form.',
  'text_area',
  0,
  0,
  'none',
  NULL,
  1,
  1
FROM sectors s
JOIN subdimensions sd
WHERE s.code IN ('RETAIL', 'BANKING', 'INSURANCE', 'TELECOM')
  AND sd.code = 'VOC_ACTIONING';

INSERT INTO questions (
  sector_id,
  subdimension_id,
  question_text,
  helper_text,
  answer_type,
  is_mandatory,
  is_scored,
  scoring_strategy,
  weight,
  display_order,
  is_active
)
SELECT
  s.id,
  sd.id,
  CONCAT('Which practice makes ', s.name, ' feedback actioning sustainable at higher maturity?'),
  'Seed follow-up for dynamic assessment form.',
  'text_area',
  0,
  0,
  'none',
  NULL,
  2,
  1
FROM sectors s
JOIN subdimensions sd
WHERE s.code IN ('RETAIL', 'BANKING', 'INSURANCE', 'TELECOM')
  AND sd.code = 'VOC_ACTIONING';

INSERT INTO questions (
  sector_id,
  subdimension_id,
  question_text,
  helper_text,
  answer_type,
  is_mandatory,
  is_scored,
  scoring_strategy,
  weight,
  display_order,
  is_active
)
SELECT
  s.id,
  sd.id,
  CONCAT('Add any extra context about trust and transparency for ', s.name, '.'),
  'Seed optional text area for dynamic assessment form.',
  'text_area',
  0,
  0,
  'none',
  NULL,
  1,
  1
FROM sectors s
JOIN subdimensions sd
WHERE s.code IN ('RETAIL', 'BANKING', 'INSURANCE', 'TELECOM')
  AND sd.code = 'TRUST_SIGNALS';

INSERT INTO question_display_rules (
  question_id,
  depends_on_question_id,
  operator,
  expected_option_id,
  expected_value,
  min_score,
  max_score,
  rule_group,
  is_active
)
SELECT
  child.id,
  parent.id,
  'score_lte',
  NULL,
  NULL,
  NULL,
  1.0000,
  'low_maturity_follow_up',
  1
FROM questions child
JOIN questions parent
  ON parent.sector_id = child.sector_id
  AND parent.subdimension_id = child.subdimension_id
  AND parent.helper_text = 'Seed data for dynamic assessment form.'
WHERE child.helper_text = 'Seed follow-up for dynamic assessment form.';

UPDATE question_display_rules qdr
JOIN questions child ON child.id = qdr.question_id
SET
  qdr.operator = 'score_gte',
  qdr.min_score = 3.0000,
  qdr.max_score = NULL,
  qdr.rule_group = 'high_maturity_follow_up'
WHERE child.question_text LIKE 'Which practice makes % feedback actioning sustainable at higher maturity?';

UPDATE question_display_rules qdr
JOIN questions child ON child.id = qdr.question_id
SET
  qdr.rule_group = 'low_maturity_follow_up'
WHERE child.question_text LIKE 'What is the biggest blocker preventing % from acting on customer feedback?';

COMMIT;
