-- M2: three indexes on invites.token — keep only the unique constraint, drop redundant btree indexes
DROP INDEX IF EXISTS invites_token_idx;
DROP INDEX IF EXISTS invites_token;