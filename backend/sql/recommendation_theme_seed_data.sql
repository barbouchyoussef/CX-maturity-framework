-- Deterministic recommendation themes for testing the results page.
-- The app maps low / medium / high maturity bands to these text themes.

START TRANSACTION;

INSERT INTO recommendation_themes (
  sector_id,
  subdimension_id,
  low_maturity_theme,
  medium_maturity_theme,
  high_maturity_theme,
  is_active
)
SELECT
  s.id,
  sd.id,
  CONCAT(
    'Stabilize ', LOWER(sd.name), ' for ', s.name,
    ' by assigning a clear owner, defining minimum evidence, and removing the most visible customer friction before scaling broader transformation.'
  ),
  CONCAT(
    'Standardize ', LOWER(sd.name), ' for ', s.name,
    ' across the priority journeys, connect it to governance cadence and operating metrics, and make responsibilities repeatable across teams.'
  ),
  CONCAT(
    'Optimize ', LOWER(sd.name), ' for ', s.name,
    ' by scaling the strongest practices, introducing proactive monitoring, and using the capability as a differentiator in the CX operating model.'
  ),
  1
FROM sectors s
CROSS JOIN subdimensions sd
JOIN dimensions d ON d.id = sd.dimension_id
WHERE s.is_active = 1
  AND sd.is_active = 1
  AND d.is_active = 1
ON DUPLICATE KEY UPDATE
  low_maturity_theme = VALUES(low_maturity_theme),
  medium_maturity_theme = VALUES(medium_maturity_theme),
  high_maturity_theme = VALUES(high_maturity_theme),
  is_active = VALUES(is_active);

COMMIT;
