// Loads a bank file (from npm run db:export) into the question bank.
//
//   npm run db:import -- backups/bank-2026-10-13.json          the real database
//   npm run db:import:local -- backups/bank-2026-10-13.json    the local database (.wrangler/)
//   ... --dry-run                                              only show what would be added
//
// Only items missing from the bank are added. Items already there are never touched, so
// edits made in the app are safe, and running it again changes nothing. To put back an
// older version of an item that exists, use "previous versions" in the app.

import { readFileSync } from 'node:fs';
import { chunks, counts, d1, databaseName, loadAppModule, quote } from './d1.mjs';

const remote = process.argv.includes('--remote');
const dryRun = process.argv.includes('--dry-run');
const source = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!source) {
	console.error('Which file? e.g. npm run db:import:local -- backups/bank-2026-10-13.json');
	process.exit(1);
}

// --- The file, checked ---

const file = JSON.parse(readFileSync(source, 'utf8'));
if (file?.format !== 1 || !Array.isArray(file.items)) {
	console.error(`${source} is not a bank file (expected format 1 with items).`);
	process.exit(1);
}
const items = file.items;
const { checkBankItems } = await loadAppModule('src/content/checkBank.ts');
const problems = checkBankItems(items);
if (problems.length) {
	console.error(`The file has problems; nothing was loaded:\n${problems.map((p) => `  ${p}`).join('\n')}`);
	process.exit(1);
}
console.log(`File: ${counts(items)} (all valid)`);

// --- What the bank already has ---

console.log(`Database: ${databaseName(remote)}`);
const [existingRows] = d1('SELECT id, kind FROM bank_items', { remote });
const existing = new Map(existingRows.map((row) => [row.id, row.kind]));
console.log(`In the bank now: ${existing.size} items`);

const clashes = items.filter((item) => existing.has(item.id) && existing.get(item.id) !== item.kind);
for (const item of clashes) console.log(`Skipping ${item.id}: the bank has it as a ${existing.get(item.id)}`);

const missing = items.filter((item) => !existing.has(item.id));
if (!missing.length) {
	console.log('Nothing to add: every item in the file is already in the bank.');
	process.exit(0);
}
console.log(`To add: ${counts(missing)}`);
if (dryRun) {
	console.log('Dry run: nothing was written.');
	process.exit(0);
}

// --- Load ---

// Each item is added only if its id is free (in the file's order, after what the bank
// has), and recorded as version 1 in the history.
function insertSql({ id, kind, hidden, data }, now) {
	return `INSERT OR IGNORE INTO bank_items (id, kind, data, hidden, version, updated_at, position)
VALUES (${quote(id)}, ${quote(kind)}, ${quote(JSON.stringify(data))}, ${hidden ? 1 : 0}, 1, ${now},
	(SELECT COALESCE(MAX(position), 0) + 1 FROM bank_items));
INSERT OR IGNORE INTO bank_history (id, version, kind, data, saved_at)
SELECT id, version, kind, data, updated_at FROM bank_items WHERE id = ${quote(id)} AND version = 1 AND updated_at = ${now};`;
}

const now = Date.now();
const batches = chunks(missing.map((item) => insertSql(item, now)));
batches.forEach((sql, i) => {
	d1(sql, { remote });
	console.log(`  batch ${i + 1}/${batches.length} done`);
});
// One bump for the whole load, so devices fetch the new bank once.
const [after, [revision]] = d1(`INSERT INTO bank_meta (key, value) VALUES ('revision', 1)
	ON CONFLICT(key) DO UPDATE SET value = value + 1;
SELECT kind, COUNT(*) AS n FROM bank_items GROUP BY kind ORDER BY kind;
SELECT value FROM bank_meta WHERE key = 'revision'`, { remote }).slice(1);
console.log(`Done. The bank now has: ${after.map((row) => `${row.n} ${row.kind}`).join(', ')} (revision ${revision?.value})`);
