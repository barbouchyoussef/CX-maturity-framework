-- Safe default industry seed data for the public assessment start form.
-- Run this before question seeds when the sectors table is empty.

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

COMMIT;
