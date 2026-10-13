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

-- The question bank (replacing built-in content). One row per item: a passage with its
-- questions, a standalone math question, or an official test whose sections reference
-- passages and questions by id.
CREATE TABLE IF NOT EXISTS bank_items (
	id TEXT PRIMARY KEY,
	kind TEXT NOT NULL CHECK (kind IN ('passage', 'question', 'test')),
	data TEXT NOT NULL,
	hidden INTEGER NOT NULL DEFAULT 0,
	-- Bumped on every content change; a writer must send the version it edited.
	version INTEGER NOT NULL,
	updated_at INTEGER NOT NULL,
	-- Display order in lists.
	position INTEGER NOT NULL DEFAULT 0
);

-- Every saved version of every item (the current one included), for "restore a version".
CREATE TABLE IF NOT EXISTS bank_history (
	id TEXT NOT NULL,
	version INTEGER NOT NULL,
	kind TEXT NOT NULL,
	data TEXT NOT NULL,
	saved_at INTEGER NOT NULL,
	PRIMARY KEY (id, version)
);

-- 'revision': bumped on any change to the bank, so devices can ask "anything new?".
CREATE TABLE IF NOT EXISTS bank_meta (
	key TEXT PRIMARY KEY,
	value INTEGER NOT NULL
);
INSERT OR IGNORE INTO bank_meta (key, value) VALUES ('revision', 0);
