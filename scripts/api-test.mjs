// End-to-end test of the login and the progress API against a local dev server.
//
//   1. cp .dev.vars.example .dev.vars   (once; set a password and a secret)
//   2. npm run db:schema:local          (once)
//   3. npm run dev:api                  (in one terminal)
//   4. npm run test:api                 (in another)
//
// Works on the local database only (.wrangler/), never on the real site.

import { createHmac } from 'node:crypto';
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
check('the bank is closed', (await request('/api/bank')).status === 401);
check('bank writes are closed', (await request('/api/bank/x', { method: 'PUT', body: {} })).status === 401);
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

// --- Families --------------------------------------------------------------------
// Needs the admin family in the local database (npm run db:bootstrap:local -- ...), with
// FAMILY_PASSWORD as its password (as right after bootstrap).

console.log('— families');
const base64url = (buffer) => buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hmac = (text) => base64url(createHmac('sha256', vars.SESSION_SECRET).update(text).digest());
// The same signing as functions/_lib/session.ts.
const signToken = (payload) => {
	const body = base64url(Buffer.from(JSON.stringify(payload)));
	return `${body}.${hmac(body)}`;
};

const adminSession = (await request('/api/session', { cookie })).data;
check('FAMILY_PASSWORD logs in as the admin family', adminSession.family?.admin === true, adminSession);

const oldCookie = `session=${signToken({ exp: Date.now() + 60_000 })}`;
const oldSession = (await request('/api/session', { cookie: oldCookie })).data;
check('a cookie from before families belongs to the admin family', oldSession.family?.id === adminSession.family?.id, oldSession);
check('... and still opens the API', (await request('/api/progress', { cookie: oldCookie })).status === 200);

// --- Children and progress per child (as the admin family) ---------------------------

console.log('— /api/children');
const children = (path = '', options = {}) => request(`/api/children${path}`, { ...options, cookie });
const listed = await children();
check('the family has its first child', listed.status === 200 && listed.data.children.length >= 1, listed.data);
const firstChild = listed.data.children[0];

const added = await children('', { method: 'POST', body: { name: '  ילד   בדיקה ', icon: '🦊' } });
const addedId = added.data.child?.id;
check('a child can be added (name tidied)', added.status === 201 && added.data.child?.name === 'ילד בדיקה' && added.data.child.icon === '🦊', added.data);
check('a new child goes last', added.data.children?.at(-1)?.id === addedId);
check('a child needs a name', (await children('', { method: 'POST', body: { name: '   ' } })).status === 400);
check('a child name has a length limit', (await children('', { method: 'POST', body: { name: 'א'.repeat(41) } })).status === 400);
const renamed = await children(`/${addedId}`, { method: 'PATCH', body: { name: 'שם חדש' } });
check('a child can be renamed (icon kept)', renamed.data.child?.name === 'שם חדש' && renamed.data.child.icon === '🦊', renamed.data);

console.log('— /api/progress per child');
const progressOf = (child, options = {}) => request(`/api/progress${child ? `?child=${child}` : ''}`, { ...options, cookie });
const firstProgress = await progressOf(firstChild.id);
check('no child named → the first child', (await progressOf()).data.version === firstProgress.data.version);
const addedProgress = await progressOf(addedId, { method: 'PUT', body: { progress: { version: 1, stars: 7, stickers: [], sessions: [] }, baseVersion: 0 } });
check('each child has its own progress', addedProgress.status === 200 && (await progressOf(addedId)).data.progress?.stars === 7, addedProgress.data);
check('... which leaves the first child alone', (await progressOf(firstChild.id)).data.version === firstProgress.data.version);
check('an unknown child → 404', (await progressOf('c-nobody')).status === 404);

// --- Other families (the admin API) -----------------------------------------------

console.log('— /api/admin/families');
const admin = (path = '', options = {}) => request(`/api/admin/families${path}`, { ...options, cookie });
const familyName = `בדיקה ${Date.now().toString(36)}`;
const familyPassword = `pw-${Math.random().toString(36).slice(2)}`;
const created = await admin('', { method: 'POST', body: { name: familyName, password: familyPassword, child: { name: 'נכד', icon: '🐢' } } });
const familyId = created.data.created;
try {
	const entry = created.data.families?.find((f) => f.id === familyId);
	check('the admin creates a family with a first child', created.status === 201 && entry?.children[0]?.name === 'נכד', created.data);
	check('the list never holds passwords', !JSON.stringify(created.data).includes(familyPassword) && entry?.hasPassword === true);
	check('the admin family comes first', created.data.families?.[0]?.admin === true);
	check('a password belongs to one family', (await admin('', { method: 'POST', body: { name: `${familyName}-2`, password: familyPassword } })).status === 409);
	check('so does a name (any case)', (await admin('', { method: 'POST', body: { name: familyName.toUpperCase(), password: `${familyPassword}-2` } })).status === 409);
	check('FAMILY_PASSWORD is taken too', (await admin('', { method: 'POST', body: { name: `${familyName}-3`, password: vars.FAMILY_PASSWORD } })).status === 409);
	check('a short password → 400', (await admin('', { method: 'POST', body: { name: `${familyName}-4`, password: '123' } })).status === 400);

	const otherLogin = await request('/api/login', { method: 'POST', body: { password: familyPassword } });
	const otherCookie = (otherLogin.headers.get('set-cookie') ?? '').split(';')[0];
	const as = (path, options = {}) => request(path, { ...options, cookie: otherCookie });
	const otherSession = (await as('/api/session')).data;
	check('the family logs in with its password', otherSession.family?.id === familyId && otherSession.family.admin === false, otherSession);
	const theirChildren = (await as('/api/children')).data.children;
	check('a family sees only its own children', theirChildren?.length === 1 && theirChildren[0].name === 'נכד', theirChildren);
	check('another family\'s child is out of reach', (await as(`/api/progress?child=${firstChild.id}`)).status === 404);
	check('... also for renaming', (await as(`/api/children/${firstChild.id}`, { method: 'PATCH', body: { name: 'x' } })).status === 404);
	check('a family reads the bank', (await as('/api/bank?rev=-1')).status === 200);
	check('only the admin writes the bank', (await as('/api/bank/x', { method: 'PATCH', body: { hidden: true } })).status === 403);
	check('only the admin manages families', (await as('/api/admin/families')).status === 403);
	check('the last child cannot be removed', (await as(`/api/children/${theirChildren[0].id}`, { method: 'DELETE' })).status === 409);

	const newPassword = `${familyPassword}-new`;
	check('the admin sets a new password', (await admin(`/${familyId}`, { method: 'PATCH', body: { password: newPassword } })).status === 200);
	check('the old password stops working', (await request('/api/login', { method: 'POST', body: { password: familyPassword } })).status === 401);
	check('the new one works', (await request('/api/login', { method: 'POST', body: { password: newPassword } })).status === 200);

	check('the admin family cannot be deleted', (await admin(`/${adminSession.family.id}`, { method: 'DELETE' })).status === 409);
	const deleted = await admin(`/${familyId}`, { method: 'DELETE' });
	check('a family can be deleted', deleted.status === 200 && !deleted.data.families.some((f) => f.id === familyId), deleted.data);
	check('a deleted family is out of the API', (await as('/api/children')).status === 401);
	check('... and its session reports logged out', (await as('/api/session')).data.authenticated === false);
} finally {
	if (familyId) await admin(`/${familyId}`, { method: 'DELETE' });
}

const forged = `session=${signToken({ exp: Date.now() + 60_000, fam: 'f-nobody' })}`;
check('a cookie for an unknown family is rejected', (await request('/api/progress', { cookie: forged })).status === 401);

check('a child can be removed, with its progress', (await children(`/${addedId}`, { method: 'DELETE' })).status === 200
	&& (await progressOf(addedId)).status === 404);

// --- Versioned documents (progress) ---------------------------------

// The same save / conflict / validation rules for every versioned document.
async function testDocument({ path, field, make, foreign, read }) {
	console.log(`— ${path} (logged in)`);
	const call = (method, body) => request(path, { method, body, cookie });

	const initial = await call('GET');
	check('GET answers 200', initial.status === 200, initial);
	check('GET is never cached', initial.headers.get('cache-control') === 'no-store');
	const base = initial.data.version;
	check('version is a non-negative integer', Number.isInteger(base) && base >= 0, initial.data);
	if (base === 0) check(`empty database returns ${field}: null`, initial.data[field] === null);

	const marker = Math.floor(Math.random() * 1000);
	const saved = await call('PUT', { [field]: make(marker), baseVersion: base });
	check('PUT on the current version answers 200', saved.status === 200, saved.data);
	check('PUT bumps the version', saved.data.version === base + 1, saved.data);

	const back = await call('GET');
	check('GET returns what was saved', read(back.data[field]) === marker, back.data);
	check('updatedAt is a timestamp', typeof back.data.updatedAt === 'number', back.data);

	const stale = await call('PUT', { [field]: make(1), baseVersion: base });
	check('PUT on a stale version answers 409', stale.status === 409, stale.data);
	check('409 carries the server copy', read(stale.data[field]) === marker && stale.data.version === base + 1, stale.data);

	check('invalid JSON → 400', (await call('PUT', '{oops')).status === 400);
	check('wrong format version → 400', (await call('PUT', { [field]: { ...make(1), version: 99 }, baseVersion: base + 1 })).status === 400);
	for (const [name, doc] of Object.entries(foreign)) {
		check(`${name} → 400`, (await call('PUT', { [field]: doc, baseVersion: base + 1 })).status === 400);
	}
	check('missing baseVersion → 400', (await call('PUT', { [field]: make(1) })).status === 400);
	const huge = { ...make(1), padding: 'x'.repeat(1100 * 1024) };
	check('oversized document → 413', (await call('PUT', { [field]: huge, baseVersion: base + 1 })).status === 413);
}

await testDocument({
	path: '/api/progress',
	field: 'progress',
	make: (stars) => ({ version: 1, stars, stickers: [], sessions: [] }),
	read: (doc) => doc?.stars,
	foreign: { 'foreign document': { hello: 1 } },
});

// --- Question bank -------------------------------------------------------------

console.log('— /api/bank (logged in)');
{
	const bank = (path = '', options = {}) => request(`/api/bank${path}`, { ...options, cookie });
	// A unique id per run, so the test works on a database that already holds items.
	const id = `test-${Date.now().toString(36)}`;
	const question = (body) => ({
		id, type: 'word-problem', body, explanation: 'כי.', answer: { kind: 'choice', options: ['א', 'ב'], correctIndex: 0 },
	});

	const first = await bank();
	check('GET answers with the items and a revision', first.status === 200 && Array.isArray(first.data.items) && Number.isInteger(first.data.revision), first.data);
	check('GET is never cached', first.headers.get('cache-control') === 'no-store');
	const unchanged = await bank(`?rev=${first.data.revision}`);
	check('an up-to-date device gets "unchanged" without the items', unchanged.data.unchanged === true && !unchanged.data.items, unchanged.data);

	const created = await bank(`/${id}`, { method: 'PUT', body: { kind: 'question', data: question('v1'), baseVersion: 0 } });
	check('creating an item answers 200 with version 1', created.status === 200 && created.data.item?.version === 1, created.data);
	check('a change bumps the bank revision', created.data.revision > first.data.revision, created.data);
	const listed = await bank(`?rev=${first.data.revision}`);
	check('a device with an old revision gets the new item', listed.data.items?.some((item) => item.id === id && item.data.body === 'v1'), listed.data);
	check('creating the same id again → 409', (await bank(`/${id}`, { method: 'PUT', body: { kind: 'question', data: question('again'), baseVersion: 0 } })).status === 409);

	const updated = await bank(`/${id}`, { method: 'PUT', body: { kind: 'question', data: question('v2'), baseVersion: 1 } });
	check('an update on the current version bumps it', updated.status === 200 && updated.data.item?.version === 2 && updated.data.item.data.body === 'v2', updated.data);
	const stale = await bank(`/${id}`, { method: 'PUT', body: { kind: 'question', data: question('stale'), baseVersion: 1 } });
	check('an update on a stale version → 409 with the current item', stale.status === 409 && stale.data.item?.data.body === 'v2', stale.data);
	check('the kind of an item cannot change', (await bank(`/${id}`, { method: 'PUT', body: { kind: 'passage', data: { id, title: 'x', paragraphs: [], questions: [] }, baseVersion: 2 } })).status === 409);

	const hidden = await bank(`/${id}`, { method: 'PATCH', body: { hidden: true } });
	check('hiding sets the flag without a new content version', hidden.status === 200 && hidden.data.item?.hidden === true && hidden.data.item.version === 2, hidden.data);
	check('hiding bumps the revision', hidden.data.revision > updated.data.revision, hidden.data);

	const history = await bank(`/${id}/history`);
	check('the history keeps every saved version, newest first', JSON.stringify(history.data.versions?.map((v) => [v.version, v.data.body])) === JSON.stringify([[2, 'v2'], [1, 'v1']]), history.data);

	check('an item filed under another id → 400', (await bank('/other-id', { method: 'PUT', body: { kind: 'question', data: question('x'), baseVersion: 0 } })).status === 400);
	check('an unknown kind → 400', (await bank(`/${id}-k`, { method: 'PUT', body: { kind: 'poem', data: { id: `${id}-k` }, baseVersion: 0 } })).status === 400);
	check('a broken shape → 400', (await bank(`/${id}-s`, { method: 'PUT', body: { kind: 'question', data: { id: `${id}-s` }, baseVersion: 0 } })).status === 400);
	check('an invalid id → 400', (await bank('/bad%20id', { method: 'PUT', body: { kind: 'question', data: { ...question('x'), id: 'bad id' }, baseVersion: 0 } })).status === 400);
	check('an oversized item → 413', (await bank(`/${id}-big`, { method: 'PUT', body: { kind: 'question', data: { ...question('x'), id: `${id}-big`, padding: 'x'.repeat(300 * 1024) }, baseVersion: 0 } })).status === 413);
	check('updating a missing item → 404', (await bank('/no-such-item', { method: 'PUT', body: { kind: 'question', data: { ...question('x'), id: 'no-such-item' }, baseVersion: 3 } })).status === 404);
	check('hiding a missing item → 404', (await bank('/no-such-item', { method: 'PATCH', body: { hidden: true } })).status === 404);

	check('deleting a stale version → 409', (await bank(`/${id}?baseVersion=1`, { method: 'DELETE' })).status === 409);
	const deleted = await bank(`/${id}?baseVersion=2`, { method: 'DELETE' });
	check('deleting the current version works', deleted.status === 200 && deleted.data.deleted === id, deleted.data);
	check('the deleted item is gone from the bank', !(await bank()).data.items.some((item) => item.id === id));
	check('its history stays', (await bank(`/${id}/history`)).data.versions?.length === 2);
	check('deleting it again → 404', (await bank(`/${id}?baseVersion=2`, { method: 'DELETE' })).status === 404);
}

// --- Logout --------------------------------------------------------------------

console.log('— logout');
const logout = await request('/api/logout', { method: 'POST', cookie });
check('logout clears the cookie', /Max-Age=0/.test(logout.headers.get('set-cookie') ?? ''));

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
