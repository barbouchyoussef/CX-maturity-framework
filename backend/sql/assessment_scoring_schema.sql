-- Assessment answer and scoring persistence.
-- This keeps the current framework structure and adds legacy-inspired result tables.

CREATE TABLE IF NOT EXISTS assessment_answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_option_id INT NULL,
  answer_text TEXT NULL,
  numeric_score DECIMAL(8,4) NULL,
  confidence_score DECIMAL(8,4) NULL,
  answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_assessment_question_answer (assessment_id, question_id),
  KEY idx_assessment_answers_assessment (assessment_id),
  KEY idx_assessment_answers_question (question_id),
  KEY idx_assessment_answers_option (selected_option_id)
);

CREATE TABLE IF NOT EXISTS assessment_answer_selected_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_answer_id INT NOT NULL,
  question_option_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_assessment_answer_selected_option (assessment_answer_id, question_option_id),
  KEY idx_assessment_answer_selected_option_answer (assessment_answer_id),
  KEY idx_assessment_answer_selected_option_option (question_option_id)
);

CREATE TABLE IF NOT EXISTS assessment_subdimension_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT NOT NULL,
  subdimension_id INT NOT NULL,
  raw_score DECIMAL(8,4) NULL,
  normalized_score_percent DECIMAL(8,4) NULL,
  weighted_score_contribution DECIMAL(8,4) NULL,
  maturity_band VARCHAR(50) NULL,
  calculation_details TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_assessment_subdimension_score (assessment_id, subdimension_id),
  KEY idx_assessment_subdimension_scores_assessment (assessment_id),
  KEY idx_assessment_subdimension_scores_subdimension (subdimension_id)
);

CREATE TABLE IF NOT EXISTS assessment_dimension_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT NOT NULL,
  dimension_id INT NOT NULL,
  score_percent DECIMAL(8,4) NULL,
  calculation_details TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_assessment_dimension_score (assessment_id, dimension_id),
  KEY idx_assessment_dimension_scores_assessment (assessment_id),
  KEY idx_assessment_dimension_scores_dimension (dimension_id)
);

CREATE TABLE IF NOT EXISTS recommendation_themes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sector_id INT NOT NULL,
  subdimension_id INT NOT NULL,
  low_maturity_theme TEXT NOT NULL,
  medium_maturity_theme TEXT NOT NULL,
  high_maturity_theme TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_recommendation_theme (sector_id, subdimension_id),
  KEY idx_recommendation_themes_sector (sector_id),
  KEY idx_recommendation_themes_subdimension (subdimension_id)
);

CREATE TABLE IF NOT EXISTS assessment_recommendations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT NOT NULL,
  subdimension_id INT NOT NULL,
  recommendation_type VARCHAR(100) NOT NULL DEFAULT 'maturity_theme',
  recommendation_title VARCHAR(255) NOT NULL,
  recommendation_text TEXT NOT NULL,
  priority_level VARCHAR(50) NOT NULL,
  source_theme_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_assessment_recommendations_assessment (assessment_id),
  KEY idx_assessment_recommendations_subdimension (subdimension_id),
  KEY idx_assessment_recommendations_priority (priority_level)
);

CREATE OR REPLACE VIEW vw_dimension_results AS
SELECT
  ads.id AS assessment_dimension_score_id,
  ads.assessment_id,
  a.company_name,
  sec.name AS sector_name,
  d.id AS dimension_id,
  d.code AS dimension_code,
  d.name AS dimension_name,
  d.weight AS dimension_weight,
  ads.score_percent,
  ads.calculation_details,
  ads.created_at,
  ads.updated_at
FROM assessment_dimension_scores ads
JOIN assessments a ON a.id = ads.assessment_id
LEFT JOIN sectors sec ON sec.id = a.sector_id
JOIN dimensions d ON d.id = ads.dimension_id;

CREATE OR REPLACE VIEW vw_answer_detail AS
SELECT
  aa.id AS assessment_answer_id,
  aa.assessment_id,
  a.company_name,
  sec.name AS sector_name,
  d.id AS dimension_id,
  d.code AS dimension_code,
  d.name AS dimension_name,
  sd.id AS subdimension_id,
  sd.code AS subdimension_code,
  sd.name AS subdimension_name,
  q.id AS question_id,
  q.question_text,
  q.answer_type,
  q.is_mandatory,
  q.is_scored,
  q.scoring_strategy,
  qo.option_label AS selected_option_label,
  qo.option_value AS selected_option_value,
  aa.answer_text,
  aa.numeric_score,
  aa.confidence_score,
  aa.answered_at
FROM assessment_answers aa
JOIN assessments a ON a.id = aa.assessment_id
LEFT JOIN sectors sec ON sec.id = a.sector_id
JOIN questions q ON q.id = aa.question_id
JOIN subdimensions sd ON sd.id = q.subdimension_id
JOIN dimensions d ON d.id = sd.dimension_id
LEFT JOIN question_answer_options qo ON qo.id = aa.selected_option_id;

CREATE OR REPLACE VIEW vw_multiselect_answer_detail AS
SELECT
  aa.assessment_id,
  a.company_name,
  q.id AS question_id,
  q.question_text,
  qo.id AS selected_option_id,
  qo.option_label AS selected_option_label,
  qo.option_value AS selected_option_value,
  qo.score AS selected_option_score,
  aa.answer_text,
  aa.answered_at
FROM assessment_answer_selected_options aaso
JOIN assessment_answers aa ON aa.id = aaso.assessment_answer_id
JOIN assessments a ON a.id = aa.assessment_id
JOIN questions q ON q.id = aa.question_id
JOIN question_answer_options qo ON qo.id = aaso.question_option_id;

CREATE OR REPLACE VIEW vw_subdimension_results AS
SELECT
  ass.id AS assessment_subdimension_score_id,
  ass.assessment_id,
  a.company_name,
  sec.name AS sector_name,
  d.id AS dimension_id,
  d.code AS dimension_code,
  d.name AS dimension_name,
  sd.id AS subdimension_id,
  sd.code AS subdimension_code,
  sd.name AS subdimension_name,
  sd.weight AS subdimension_weight,
  ass.raw_score,
  ass.normalized_score_percent,
  ass.weighted_score_contribution,
  ass.maturity_band,
  ass.calculation_details,
  ass.created_at,
  ass.updated_at
FROM assessment_subdimension_scores ass
JOIN assessments a ON a.id = ass.assessment_id
LEFT JOIN sectors sec ON sec.id = a.sector_id
JOIN subdimensions sd ON sd.id = ass.subdimension_id
JOIN dimensions d ON d.id = sd.dimension_id;

CREATE OR REPLACE VIEW vw_recommendations AS
SELECT
  ar.id AS recommendation_id,
  ar.assessment_id,
  a.company_name,
  sec.name AS sector_name,
  d.id AS dimension_id,
  d.code AS dimension_code,
  d.name AS dimension_name,
  sd.id AS subdimension_id,
  sd.code AS subdimension_code,
  sd.name AS subdimension_name,
  ar.recommendation_type,
  ar.recommendation_title,
  ar.recommendation_text,
  ar.priority_level,
  ar.source_theme_type,
  ar.created_at,
  ar.updated_at
FROM assessment_recommendations ar
JOIN assessments a ON a.id = ar.assessment_id
LEFT JOIN sectors sec ON sec.id = a.sector_id
JOIN subdimensions sd ON sd.id = ar.subdimension_id
JOIN dimensions d ON d.id = sd.dimension_id;
