// Saves the whole question bank to a file: a backup, and the way to move the bank to a new
// database (npm run db:import).
//
//   npm run db:export                the real database
//   npm run db:export:local          the local database (.wrangler/)
//   ... -- path/to/file.json         another file name
//
// By default the file goes to backups/bank-<date>.json (not committed: the content is
// for personal use).

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { counts, d1, databaseName, loadAppModule, ROOT } from './d1.mjs';

const remote = process.argv.includes('--remote');
const target = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
	?? join(ROOT, 'backups', `bank-${new Date().toISOString().slice(0, 10)}${remote ? '' : '-local'}.json`);

console.log(`Database: ${databaseName(remote)}`);
const [rows, [meta]] = d1(
	"SELECT id, kind, data, hidden FROM bank_items ORDER BY position, id; SELECT value FROM bank_meta WHERE key = 'revision'",
	{ remote },
);
const items = rows.map((row) => ({ id: row.id, kind: row.kind, hidden: row.hidden === 1, data: JSON.parse(row.data) }));

// Saved even if something is wrong, so a backup is never lost; the problems are listed.
const { checkBankItems } = await loadAppModule('src/content/checkBank.ts');
const problems = checkBankItems(items);

const file = { format: 1, exportedAt: new Date().toISOString(), revision: meta?.value ?? 0, items };
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(file, null, '\t')}\n`.replace(/\n/g, '\r\n'));

console.log(`Saved ${counts(items)} (revision ${file.revision}) to ${relative(process.cwd(), target)}`);
if (problems.length) {
	console.log(`Warning: the bank has problems an import would refuse:\n${problems.map((p) => `  ${p}`).join('\n')}`);
	process.exitCode = 1;
}
