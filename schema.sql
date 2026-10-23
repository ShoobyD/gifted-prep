-- Idempotent: safe to run again (npm run db:schema / db:schema:local).

-- Each child's progress as one JSON document (the app's ProgressState).
-- One row per child, with the child's id (see children).
CREATE TABLE IF NOT EXISTS progress (
	id TEXT PRIMARY KEY,
	data TEXT NOT NULL,
	-- Incremented on every write; a writer must send the version it based its change on.
	version INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

-- The question bank. One row per item: a passage with its
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

-- Families: each logs in with its own password and sees only its own children. The admin
-- family also edits the question bank and manages the other families.
CREATE TABLE IF NOT EXISTS families (
	id TEXT PRIMARY KEY,
	-- Shown to the admin and in the app; unique regardless of case.
	name TEXT NOT NULL UNIQUE COLLATE NOCASE,
	-- The password hashed with the server's secret (functions/_lib/families.ts). NULL only
	-- for the admin family before it sets a password of its own: it then logs in with
	-- FAMILY_PASSWORD, as before families existed.
	password_hash TEXT,
	is_admin INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL
);

-- A password is how a family is found at login, so no two families may share one.
CREATE UNIQUE INDEX IF NOT EXISTS families_by_password ON families (password_hash);

-- A family's children. Each child has its own progress (the progress row with the child's id).
CREATE TABLE IF NOT EXISTS children (
	id TEXT PRIMARY KEY,
	family_id TEXT NOT NULL REFERENCES families (id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	-- An emoji the child recognizes on the shared tablet's "who is practicing?" screen.
	icon TEXT NOT NULL DEFAULT '',
	-- Display order; the first child also gets requests that name no child.
	position INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS children_by_family ON children (family_id, position);
