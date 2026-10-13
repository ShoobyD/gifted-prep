// Shared by the database scripts: running SQL on D1 through wrangler, and loading the
// app's TypeScript modules (with the @/ alias) through Vite.

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
const WRANGLER = join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const DATABASE = 'gifted-prep';
// Windows limits a command line to 32767 characters; leave room for the rest of it.
const MAX_CHUNK = 24_000;

// Runs SQL and returns each statement's result rows. Goes through --command rather than
// --file: the remote --file import fails on this account.
export function d1(sql, { remote }) {
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

export const quote = (text) => `'${String(text).replaceAll("'", "''")}'`;

// Groups statements into commands short enough for one command line.
export function chunks(statements) {
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

export function databaseName(remote) {
	return remote ? 'REMOTE (the real site)' : 'local (.wrangler/)';
}

export async function loadAppModule(path) {
	const { module } = await runnerImport(join(ROOT, path), {
		root: ROOT,
		configFile: false,
		logLevel: 'error',
		resolve: { alias: { '@': join(ROOT, 'src') } },
	});
	return module;
}

export const counts = (items) => {
	const by = {};
	for (const { kind } of items) by[kind] = (by[kind] ?? 0) + 1;
	return Object.entries(by).map(([kind, n]) => `${n} ${kind}`).join(', ') || 'nothing';
};
