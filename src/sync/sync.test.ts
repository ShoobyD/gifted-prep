import { describe, expect, it } from 'vitest';
import { defaultProgress, type ProgressState, type SessionRecord } from '@/progress/state';
import { mergeProgress } from './merge';
import { createSyncEngine, type ProgressApi, type ServerCopy, type SyncMeta, type SyncStatus } from './syncEngine';

const session = (at: string, correct = 5): SessionRecord => ({ at, set: 'math-mix', correct, total: 10, stars: 10, seconds: 60 });

function progressWith(edit: (p: ProgressState) => void): ProgressState {
	const p = defaultProgress();
	edit(p);
	return p;
}

// An in-memory server with the same version rules as functions/api/progress.ts.
function fakeServer(initial: ProgressState | null = null) {
	let copy: ServerCopy = { progress: initial, version: initial ? 1 : 0, updatedAt: initial ? 1 : null };
	let offline = false;
	const clone = (): ServerCopy => JSON.parse(JSON.stringify(copy)) as ServerCopy;
	const api: ProgressApi = {
		async get() {
			if (offline) throw new Error('offline');
			return clone();
		},
		async put(progress, baseVersion) {
			if (offline) throw new Error('offline');
			if (baseVersion !== copy.version) return { ok: false, conflict: clone() };
			copy = { progress: JSON.parse(JSON.stringify(progress)) as ProgressState, version: copy.version + 1, updatedAt: Date.now() };
			return { ok: true, copy: clone() };
		},
	};
	return {
		api,
		get copy() { return copy; },
		setOffline(value: boolean) { offline = value; },
		// Another device writing directly.
		writeFromElsewhere(progress: ProgressState) {
			copy = { progress, version: copy.version + 1, updatedAt: Date.now() };
		},
	};
}

function device(server: ReturnType<typeof fakeServer>, local = defaultProgress(), meta: SyncMeta = { serverVersion: 0, dirty: false, lastSyncedAt: null }) {
	let state = local;
	const statuses: SyncStatus[] = [];
	const engine = createSyncEngine({
		api: server.api,
		read: () => JSON.parse(JSON.stringify(state)) as ProgressState,
		write: (next) => { state = next; },
		meta,
		saveMeta: () => {},
		onStatus: (s) => statuses.push(s),
	});
	return {
		engine,
		meta,
		statuses,
		get state() { return state; },
		// A local change, as the app makes it (mutate, then notify).
		change(edit: (p: ProgressState) => void) {
			edit(state);
			engine.markChanged();
		},
	};
}

describe('mergeProgress', () => {
	it('keeps everything earned on both sides', () => {
		const local = progressWith((p) => {
			p.stars = 30;
			p.stickers = ['first-session'];
			p.practiceDays = ['2026-10-10'];
			p.sessions = [session('2026-10-10T10:00:00Z')];
			p.typeStats = { exercise: { first: 5, second: 1, failed: 0 } };
			p.levels.exercise = 2;
			p.passages = { 'inf-1': 4 };
			p.settings.speech = false;
		});
		const remote = progressWith((p) => {
			p.stars = 20;
			p.stickers = ['first-session', 'perfect'];
			p.practiceDays = ['2026-10-09', '2026-10-10'];
			p.sessions = [session('2026-10-09T10:00:00Z'), session('2026-10-10T10:00:00Z')];
			p.typeStats = { exercise: { first: 3, second: 2, failed: 1 }, inference: { first: 1, second: 0, failed: 0 } };
			p.levels.inequality = 3;
			p.passages = { 'inf-1': 5, 'story-1': 3 };
		});

		const merged = mergeProgress(local, remote);
		expect(merged.stars).toBe(30);
		expect(merged.stickers.sort()).toEqual(['first-session', 'perfect']);
		expect(merged.practiceDays).toEqual(['2026-10-09', '2026-10-10']);
		expect(merged.sessions.map((s) => s.at)).toEqual(['2026-10-09T10:00:00Z', '2026-10-10T10:00:00Z']);
		expect(merged.typeStats.exercise).toEqual({ first: 5, second: 2, failed: 1 });
		expect(merged.typeStats.inference).toEqual({ first: 1, second: 0, failed: 0 });
		expect(merged.levels.exercise).toBe(2);
		expect(merged.levels.inequality).toBe(3);
		expect(merged.passages).toEqual({ 'inf-1': 5, 'story-1': 3 });
		expect(merged.settings.speech).toBe(false);
	});
});

describe('sync engine', () => {
	it('backs up a device with progress to an empty server', async () => {
		const server = fakeServer();
		const tablet = device(server, progressWith((p) => { p.stars = 12; }));
		await tablet.engine.sync();
		expect(server.copy.progress?.stars).toBe(12);
		expect(tablet.meta).toMatchObject({ serverVersion: 1, dirty: false });
		expect(tablet.statuses.at(-1)).toBe('idle');
	});

	it('does not push an empty new device over nothing', async () => {
		const server = fakeServer();
		await device(server).engine.sync();
		expect(server.copy.version).toBe(0);
	});

	it('restores the server copy onto a new device', async () => {
		const server = fakeServer(progressWith((p) => { p.stars = 99; }));
		const tablet = device(server);
		await tablet.engine.sync();
		expect(tablet.state.stars).toBe(99);
		expect(tablet.meta).toMatchObject({ serverVersion: 1, dirty: false });
		// Applying the server copy is not a local change.
		tablet.engine.markChanged();
		expect(tablet.meta.dirty).toBe(false);
	});

	it('pushes local changes and clears the pending flag', async () => {
		const server = fakeServer();
		const tablet = device(server, progressWith((p) => { p.stars = 1; }));
		await tablet.engine.sync();
		tablet.change((p) => { p.stars = 5; });
		expect(tablet.meta.dirty).toBe(true);
		await tablet.engine.sync();
		expect(server.copy.progress?.stars).toBe(5);
		expect(server.copy.version).toBe(2);
		expect(tablet.meta.dirty).toBe(false);
	});

	it('keeps changes pending while offline and sends them later', async () => {
		const server = fakeServer();
		const tablet = device(server, progressWith((p) => { p.stars = 1; }));
		await tablet.engine.sync();

		server.setOffline(true);
		tablet.change((p) => { p.stars = 7; });
		await tablet.engine.sync();
		expect(tablet.statuses.at(-1)).toBe('failed');
		expect(tablet.meta.dirty).toBe(true);
		expect(server.copy.progress?.stars).toBe(1);

		server.setOffline(false);
		await tablet.engine.sync();
		expect(server.copy.progress?.stars).toBe(7);
		expect(tablet.meta.dirty).toBe(false);
	});

	it('merges when both sides changed, losing nothing', async () => {
		const server = fakeServer();
		const tablet = device(server, progressWith((p) => { p.sessions = [session('2026-10-01T10:00:00Z')]; }));
		await tablet.engine.sync();

		// Offline round on the tablet, while another copy reached the server.
		tablet.change((p) => { p.sessions.push(session('2026-10-02T10:00:00Z')); p.stars = 40; });
		server.writeFromElsewhere(progressWith((p) => {
			p.sessions = [session('2026-10-01T10:00:00Z'), session('2026-10-03T10:00:00Z')];
			p.stars = 25;
		}));

		await tablet.engine.sync();
		const sessions = server.copy.progress?.sessions.map((s) => s.at);
		expect(sessions).toEqual(['2026-10-01T10:00:00Z', '2026-10-02T10:00:00Z', '2026-10-03T10:00:00Z']);
		expect(server.copy.progress?.stars).toBe(40);
		expect(tablet.state.sessions).toHaveLength(3);
		expect(tablet.meta.dirty).toBe(false);
	});

	it('retries on a conflict that appears between reading and writing', async () => {
		const server = fakeServer();
		const tablet = device(server, progressWith((p) => { p.stars = 1; }));
		await tablet.engine.sync();
		tablet.change((p) => { p.stickers = ['a']; });

		// Another device writes right after the tablet reads.
		const realGet = server.api.get.bind(server.api);
		server.api.get = async () => {
			const copy = await realGet();
			server.writeFromElsewhere(progressWith((p) => { p.stickers = ['b']; }));
			return copy;
		};
		await tablet.engine.sync();
		expect(server.copy.progress?.stickers.sort()).toEqual(['a', 'b']);
		expect(tablet.meta.dirty).toBe(false);
	});

	it('recovers after a failed request instead of blocking later syncs', async () => {
		const server = fakeServer();
		const tablet = device(server, progressWith((p) => { p.stars = 1; }));
		const realGet = server.api.get.bind(server.api);
		// A request that dies (in the app: a timeout aborting a hung fetch).
		server.api.get = () => Promise.reject(new Error('timeout'));
		await tablet.engine.sync();
		expect(tablet.statuses.at(-1)).toBe('failed');

		server.api.get = realGet;
		await tablet.engine.sync();
		expect(server.copy.progress?.stars).toBe(1);
		expect(tablet.statuses.at(-1)).toBe('idle');
	});

	it('coalesces overlapping sync calls', async () => {
		const server = fakeServer();
		let gets = 0;
		const realGet = server.api.get.bind(server.api);
		server.api.get = async () => { gets++; return realGet(); };
		const tablet = device(server, progressWith((p) => { p.stars = 1; }));
		await Promise.all([tablet.engine.sync(), tablet.engine.sync(), tablet.engine.sync()]);
		// One run, plus one rerun for the calls that arrived meanwhile.
		expect(gets).toBe(2);
	});
});
