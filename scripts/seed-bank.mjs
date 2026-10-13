// Loads the built-in content (src/content/seed.ts) into the question bank in D1.
//
//   npm run db:seed:local            the local database (.wrangler/)
//   npm run db:seed                  the real database
//   ... -- --dry-run                 only show what would be added
//
// Only items missing from the bank are added. Items already there are never touched, so
// edits made in the app are safe, and running it again changes nothing.
//
// Runs SQL through `wrangler d1 execute --command` in chunks: the remote --file import
// fails on this account, and a command line has a length limit.

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const WRANGLER = join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const DATABASE = 'gifted-prep';
// Windows limits a command line to 32767 characters; leave room for the rest of it.
const MAX_CHUNK = 24_000;

const remote = process.argv.includes('--remote');
const dryRun = process.argv.includes('--dry-run');

// Runs SQL and returns each statement's result rows.
function d1(sql) {
	const run = spawnSync(
		process.execPath,
		[WRANGLER, 'd1', 'execute', DATABASE, remote ? '--remote' : '--local', '--json', '--command', sql],
		{ cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
	);
	if (run.status !== 0) {
		throw new Error(`wrangler failed (${run.status}):\n${run.stderr || run.stdout}`);
	}
	return JSON.parse(run.stdout).map((statement) => statement.results ?? []);
}

const quote = (text) => `'${String(text).replaceAll("'", "''")}'`;

// Each item is added only if its id is free, and recorded as version 1 in the history.
function insertSql({ id, kind, data }, now) {
	return `INSERT OR IGNORE INTO bank_items (id, kind, data, hidden, version, updated_at, position)
VALUES (${quote(id)}, ${quote(kind)}, ${quote(JSON.stringify(data))}, 0, 1, ${now},
	(SELECT COALESCE(MAX(position), 0) + 1 FROM bank_items));
INSERT OR IGNORE INTO bank_history (id, version, kind, data, saved_at)
SELECT id, version, kind, data, updated_at FROM bank_items WHERE id = ${quote(id)} AND version = 1 AND updated_at = ${now};`;
}

function chunks(statements) {
	const result = [];
	let current = '';
	for (const statement of statements) {
		if (statement.length > MAX_CHUNK) throw new Error(`An item is too large for one command (${statement.length} characters)`);
		if (current && current.length + statement.length + 1 > MAX_CHUNK) {
			result.push(current);
			current = '';
		}
		current += `${statement}\n`;
	}
	if (current) result.push(current);
	return result;
}

const counts = (items) => {
	const by = {};
	for (const { kind } of items) by[kind] = (by[kind] ?? 0) + 1;
	return Object.entries(by).map(([kind, n]) => `${n} ${kind}`).join(', ') || 'nothing';
};

// --- The content, checked ---

const { module: seed } = await runnerImport(join(ROOT, 'src', 'content', 'seed.ts'), {
	root: ROOT,
	configFile: false,
	logLevel: 'error',
	resolve: { alias: { '@': join(ROOT, 'src') } },
});
const items = seed.seedItems();
const problems = seed.checkBankItems(items);
if (problems.length) {
	console.error(`The built-in content has problems; nothing was loaded:\n${problems.map((p) => `  ${p}`).join('\n')}`);
	process.exit(1);
}
console.log(`Built-in content: ${counts(items)} (all valid)`);

// --- What the bank already has ---

console.log(`Database: ${remote ? 'REMOTE (the real site)' : 'local (.wrangler/)'}`);
const [existingRows, overrideRows] = d1('SELECT id, kind FROM bank_items; SELECT COUNT(*) AS n FROM content');
const existing = new Map(existingRows.map((row) => [row.id, row.kind]));
console.log(`In the bank now: ${existing.size} items`);
if (overrideRows[0]?.n) {
	console.log('Note: there are saved changes in the old content table; they are not part of the bank.');
}

const clashes = items.filter((item) => existing.has(item.id) && existing.get(item.id) !== item.kind);
for (const item of clashes) console.log(`Skipping ${item.id}: the bank has it as a ${existing.get(item.id)}`);

const missing = items.filter((item) => !existing.has(item.id));
if (!missing.length) {
	console.log('Nothing to add: every built-in item is already in the bank.');
	process.exit(0);
}
console.log(`To add: ${counts(missing)}`);
if (dryRun) {
	console.log('Dry run: nothing was written.');
	process.exit(0);
}

// --- Load ---

const now = Date.now();
const batches = chunks(missing.map((item) => insertSql(item, now)));
batches.forEach((sql, i) => {
	d1(sql);
	console.log(`  batch ${i + 1}/${batches.length} done`);
});
// One bump for the whole load, so devices fetch the new bank once.
const [after, [revision]] = d1(`INSERT INTO bank_meta (key, value) VALUES ('revision', 1)
	ON CONFLICT(key) DO UPDATE SET value = value + 1;
SELECT kind, COUNT(*) AS n FROM bank_items GROUP BY kind ORDER BY kind;
SELECT value FROM bank_meta WHERE key = 'revision'`).slice(1);
console.log(`Done. The bank now has: ${after.map((row) => `${row.n} ${row.kind}`).join(', ')} (revision ${revision?.value})`);
