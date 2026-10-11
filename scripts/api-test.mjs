// End-to-end test of the progress API against a local dev server.
//
//   1. npm run db:schema:local   (once)
//   2. npm run dev:api           (in one terminal)
//   3. npm run test:api          (in another)
//
// Works on the local database only (.wrangler/), never on the real site.

const BASE = process.env.API_BASE ?? 'http://localhost:8788';

let failures = 0;

function check(name, condition, details) {
	console.log(`${condition ? '✓' : '✗'} ${name}`);
	if (!condition) {
		failures++;
		if (details !== undefined) console.log('   ', details);
	}
}

async function call(method, body) {
	const response = await fetch(`${BASE}/api/progress`, {
		method,
		headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
		body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
	});
	return { status: response.status, data: await response.json(), headers: response.headers };
}

const progress = (stars) => ({ version: 1, stars, stickers: [], sessions: [] });

// Current state: the local database may already hold data from earlier runs.
const initial = await call('GET');
check('GET answers 200', initial.status === 200, initial);
check('GET is never cached', initial.headers.get('cache-control') === 'no-store');
const base = initial.data.version;
check('version is a non-negative integer', Number.isInteger(base) && base >= 0, initial.data);
if (base === 0) check('empty database returns progress: null', initial.data.progress === null);

// A write based on the current version succeeds and bumps the version.
const stars = Math.floor(Math.random() * 1000);
const saved = await call('PUT', { progress: progress(stars), baseVersion: base });
check('PUT on the current version answers 200', saved.status === 200, saved.data);
check('PUT bumps the version', saved.data.version === base + 1, saved.data);

const read = await call('GET');
check('GET returns what was saved', read.data.progress?.stars === stars, read.data);
check('GET returns the new version', read.data.version === base + 1, read.data);
check('updatedAt is a timestamp', typeof read.data.updatedAt === 'number', read.data);

// A write based on an old version is rejected with the server copy, for merging.
const stale = await call('PUT', { progress: progress(1), baseVersion: base });
check('PUT on a stale version answers 409', stale.status === 409, stale.data);
check('409 carries the server copy', stale.data.progress?.stars === stars && stale.data.version === base + 1, stale.data);
check('the stale write did not land', (await call('GET')).data.progress?.stars === stars);

// Invalid input.
check('invalid JSON → 400', (await call('PUT', '{oops')).status === 400);
check('foreign document → 400', (await call('PUT', { progress: { hello: 1 }, baseVersion: base + 1 })).status === 400);
check('missing baseVersion → 400', (await call('PUT', { progress: progress(1) })).status === 400);
check('negative baseVersion → 400', (await call('PUT', { progress: progress(1), baseVersion: -1 })).status === 400);
const huge = { ...progress(1), padding: 'x'.repeat(600 * 1024) };
check('oversized document → 413', (await call('PUT', { progress: huge, baseVersion: base + 1 })).status === 413);

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
