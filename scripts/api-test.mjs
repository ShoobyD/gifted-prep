// End-to-end test of the login and the progress API against a local dev server.
//
//   1. cp .dev.vars.example .dev.vars   (once; set a password and a secret)
//   2. npm run db:schema:local          (once)
//   3. npm run dev:api                  (in one terminal)
//   4. npm run test:api                 (in another)
//
// Works on the local database only (.wrangler/), never on the real site.

import { readFileSync } from 'node:fs';

const BASE = process.env.API_BASE ?? 'http://localhost:8788';

// The password comes from .dev.vars, the same file wrangler reads.
const vars = Object.fromEntries(
	readFileSync(new URL('../.dev.vars', import.meta.url), 'utf8')
		.split(/\r?\n/)
		.map((line) => line.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/))
		.filter(Boolean)
		.map((m) => [m[1], m[2]]),
);
if (!vars.FAMILY_PASSWORD) throw new Error('FAMILY_PASSWORD missing in .dev.vars');

let failures = 0;

function check(name, condition, details) {
	console.log(`${condition ? '✓' : '✗'} ${name}`);
	if (!condition) {
		failures++;
		if (details !== undefined) console.log('   ', details);
	}
}

async function request(path, { method = 'GET', body, cookie } = {}) {
	const headers = {};
	if (body !== undefined) headers['Content-Type'] = 'application/json';
	if (cookie) headers.Cookie = cookie;
	const response = await fetch(`${BASE}${path}`, {
		method,
		headers,
		body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
		redirect: 'manual',
	});
	const text = await response.text();
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		data = text;
	}
	return { status: response.status, data, headers: response.headers };
}

// --- The gate ------------------------------------------------------------------

console.log('— without login');
const page = await request('/');
check('the app answers with the login page', page.status === 401 && String(page.data).includes('id="password"'));
check('the login page holds none of the app', !String(page.data).includes('/assets/'));
check('a deep link also gets the login page', (await request('/reading')).status === 401);
check('app assets are closed', (await request('/sw.js')).status === 401);
check('the API is closed', (await request('/api/progress')).status === 401);
check('writes are closed', (await request('/api/progress', { method: 'PUT', body: {} })).status === 401);
for (const open of ['/manifest.webmanifest', '/pwa-192.png', '/robots.txt']) {
	check(`${open} stays open (install / crawlers)`, (await request(open)).status === 200);
}
check('session reports logged out', (await request('/api/session')).data.authenticated === false);
check('a forged cookie is rejected', (await request('/api/progress', { cookie: 'session=eyJleHAiOjk5OTk5OTk5OTk5OTl9.AAAA' })).status === 401);

console.log('— login');
const startedWrong = Date.now();
const wrong = await request('/api/login', { method: 'POST', body: { password: 'wrong' } });
check('a wrong password is rejected', wrong.status === 401 && !wrong.headers.get('set-cookie'));
check('a wrong password is slowed down', Date.now() - startedWrong >= 900);
check('an empty body is rejected', (await request('/api/login', { method: 'POST', body: '{oops' })).status === 400);

const login = await request('/api/login', { method: 'POST', body: { password: vars.FAMILY_PASSWORD } });
const setCookie = login.headers.get('set-cookie') ?? '';
check('the right password logs in', login.status === 200 && setCookie.startsWith('session='), login.data);
check('the cookie is HttpOnly, Secure, SameSite=Lax', /HttpOnly/.test(setCookie) && /Secure/.test(setCookie) && /SameSite=Lax/.test(setCookie));
check('the cookie lasts a year', /Max-Age=31536000/.test(setCookie));
const cookie = setCookie.split(';')[0];

check('the app is served after login', (await request('/', { cookie })).status === 200);
check('session reports logged in', (await request('/api/session', { cookie })).data.authenticated === true);

// --- Progress ------------------------------------------------------------------

console.log('— progress (logged in)');
const progress = (stars) => ({ version: 1, stars, stickers: [], sessions: [] });
const call = (method, body) => request('/api/progress', { method, body, cookie });

const initial = await call('GET');
check('GET answers 200', initial.status === 200, initial);
check('GET is never cached', initial.headers.get('cache-control') === 'no-store');
const base = initial.data.version;
check('version is a non-negative integer', Number.isInteger(base) && base >= 0, initial.data);
if (base === 0) check('empty database returns progress: null', initial.data.progress === null);

const stars = Math.floor(Math.random() * 1000);
const saved = await call('PUT', { progress: progress(stars), baseVersion: base });
check('PUT on the current version answers 200', saved.status === 200, saved.data);
check('PUT bumps the version', saved.data.version === base + 1, saved.data);

const read = await call('GET');
check('GET returns what was saved', read.data.progress?.stars === stars, read.data);
check('updatedAt is a timestamp', typeof read.data.updatedAt === 'number', read.data);

const stale = await call('PUT', { progress: progress(1), baseVersion: base });
check('PUT on a stale version answers 409', stale.status === 409, stale.data);
check('409 carries the server copy', stale.data.progress?.stars === stars && stale.data.version === base + 1, stale.data);

check('invalid JSON → 400', (await call('PUT', '{oops')).status === 400);
check('foreign document → 400', (await call('PUT', { progress: { hello: 1 }, baseVersion: base + 1 })).status === 400);
check('missing baseVersion → 400', (await call('PUT', { progress: progress(1) })).status === 400);
const huge = { ...progress(1), padding: 'x'.repeat(600 * 1024) };
check('oversized document → 413', (await call('PUT', { progress: huge, baseVersion: base + 1 })).status === 413);

// --- Logout --------------------------------------------------------------------

console.log('— logout');
const logout = await request('/api/logout', { method: 'POST', cookie });
check('logout clears the cookie', /Max-Age=0/.test(logout.headers.get('set-cookie') ?? ''));

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
