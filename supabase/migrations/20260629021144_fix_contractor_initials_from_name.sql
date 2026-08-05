
UPDATE reviews
SET contractor_initials =
  UPPER(LEFT(contractor_name, 1)) ||
  UPPER(LEFT(SPLIT_PART(contractor_name, ' ', 2), 1))
WHERE contractor_name IS NOT NULL
  AND contractor_name != '';
