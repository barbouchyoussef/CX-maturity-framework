CREATE TABLE questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sector_id INT NOT NULL,
  subdimension_id INT NOT NULL,
  question_text TEXT NOT NULL,
  helper_text TEXT NULL,
  answer_type ENUM('single_select', 'multi_select', 'text_area') NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  is_scored BOOLEAN NOT NULL DEFAULT TRUE,
  scoring_strategy ENUM('none', 'single_option_score', 'multi_sum', 'multi_average', 'multi_max', 'manual') NOT NULL DEFAULT 'single_option_score',
  weight DECIMAL(8,6) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sector_id) REFERENCES sectors(id),
  FOREIGN KEY (subdimension_id) REFERENCES subdimensions(id)
);

CREATE TABLE question_answer_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  option_label VARCHAR(255) NOT NULL,
  option_value VARCHAR(100) NOT NULL,
  score DECIMAL(8,4) NULL,
  maturity_level INT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE question_display_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  depends_on_question_id INT NOT NULL,
  operator ENUM('equals', 'not_equals', 'in', 'not_in', 'score_gte', 'score_lte', 'score_between') NOT NULL,
  expected_option_id INT NULL,
  expected_value VARCHAR(255) NULL,
  min_score DECIMAL(8,4) NULL,
  max_score DECIMAL(8,4) NULL,
  rule_group VARCHAR(50) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_question_id) REFERENCES questions(id),
  FOREIGN KEY (expected_option_id) REFERENCES question_answer_options(id)
);
