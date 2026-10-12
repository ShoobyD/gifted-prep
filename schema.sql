-- Idempotent: safe to run again (npm run db:schema / db:schema:local).

-- The child's progress as one JSON document (the app's ProgressState).
-- A single row, id 'family': one child per deployment.
CREATE TABLE IF NOT EXISTS progress (
	id TEXT PRIMARY KEY,
	data TEXT NOT NULL,
	-- Incremented on every write; a writer must send the version it based its change on.
	version INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

-- The parent's changes to the question bank (the app's ContentOverrides), same shape and
-- versioning as progress. Single row, id 'family'.
CREATE TABLE IF NOT EXISTS content (
	id TEXT PRIMARY KEY,
	data TEXT NOT NULL,
	version INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);
