import type { ProgressState } from '@/progress/state';
import { mergeProgress } from './merge';

// What the server holds: version 0 and progress null when nothing was saved yet.
export interface ServerCopy {
	progress: ProgressState | null;
	version: number;
	updatedAt: number | null;
}

export type PutResult = { ok: true; copy: ServerCopy } | { ok: false; conflict: ServerCopy };

// Network calls; they throw when the server can't be reached or refuses (e.g. logged out).
export interface ProgressApi {
	get(): Promise<ServerCopy>;
	put(progress: ProgressState, baseVersion: number): Promise<PutResult>;
}

// Persisted next to the progress, so pending changes survive closing the app.
export interface SyncMeta {
	// The server version the local copy was last equal to.
	serverVersion: number;
	// Local changes not yet on the server.
	dirty: boolean;
	lastSyncedAt: number | null;
}

export type SyncStatus = 'idle' | 'syncing' | 'failed';

export interface SyncEngineOptions {
	api: ProgressApi;
	read(): ProgressState;
	// Replaces the local progress (e.g. with the server copy).
	write(progress: ProgressState): void;
	meta: SyncMeta;
	saveMeta(): void;
	onStatus?(status: SyncStatus): void;
	now?(): number;
}

// Conflicts are merged and retried; a few rounds cover two devices racing.
const MAX_PUT_ATTEMPTS = 3;

// Progress saved before generations existed counts as generation 0.
const generationOf = (progress: ProgressState) => progress.generation ?? 0;

// > 0: a is a newer generation (a later reset or import); < 0: older; 0: the same one.
function compareGenerations(a: ProgressState, b: ProgressState): number {
	return generationOf(a) - generationOf(b);
}

// Anything worth backing up: a brand-new device must not overwrite the server with nothing.
function hasContent(progress: ProgressState): boolean {
	return progress.sessions.length > 0 || progress.stars > 0 || progress.stickers.length > 0;
}

export function createSyncEngine(options: SyncEngineOptions) {
	const { api, read, write, meta, saveMeta } = options;
	const now = options.now ?? Date.now;

	// The local progress as last agreed with the server; lets markChanged() ignore
	// writes that merely applied the server copy.
	let syncedJson: string | undefined;
	let running: Promise<void> | undefined;
	let rerun = false;

	function setStatus(status: SyncStatus) {
		options.onStatus?.(status);
	}

	function markChanged() {
		if (JSON.stringify(read()) === syncedJson) return;
		if (!meta.dirty) {
			meta.dirty = true;
			saveMeta();
		}
	}

	function applyRemote(copy: ServerCopy & { progress: ProgressState }) {
		write(copy.progress);
		syncedJson = JSON.stringify(copy.progress);
		meta.serverVersion = copy.version;
		meta.dirty = false;
	}

	async function push(baseVersion: number, attempt = 1): Promise<void> {
		const snapshot = read();
		const snapshotJson = JSON.stringify(snapshot);
		const result = await api.put(snapshot, baseVersion);

		if (result.ok) {
			meta.serverVersion = result.copy.version;
			syncedJson = snapshotJson;
			// The child may have answered more questions while the request was in flight.
			meta.dirty = JSON.stringify(read()) !== snapshotJson;
			return;
		}

		// Someone wrote in between.
		const { conflict } = result;
		if (conflict.progress) {
			const order = compareGenerations(conflict.progress, read());
			// A reset or import on another device wins outright: take it and stop.
			if (order > 0) {
				applyRemote({ ...conflict, progress: conflict.progress });
				return;
			}
			// Same generation: merge both. An older one (ours was reset): just write over it.
			if (order === 0) write(mergeProgress(read(), conflict.progress));
		}
		if (attempt >= MAX_PUT_ATTEMPTS) throw new Error('sync conflict did not settle');
		await push(conflict.version, attempt + 1);
	}

	async function run() {
		setStatus('syncing');
		try {
			const server = await api.get();
			const local = read();

			const order = server.progress ? compareGenerations(server.progress, local) : 0;

			if (!server.progress) {
				// Empty server: back up whatever this device has.
				if (meta.dirty || hasContent(local)) await push(0);
			} else if (order > 0) {
				// Reset or imported on another device: replaces this one, pending changes included.
				applyRemote({ ...server, progress: server.progress });
			} else if (order < 0) {
				// Reset or imported here: replaces the server copy, without merging the old one back.
				await push(server.version);
			} else if (server.version === meta.serverVersion) {
				if (meta.dirty) await push(server.version);
				else syncedJson ??= JSON.stringify(local);
			} else if (!meta.dirty) {
				// Newer on the server and nothing pending here: take it.
				applyRemote({ ...server, progress: server.progress });
			} else {
				// Both changed.
				write(mergeProgress(local, server.progress));
				await push(server.version);
			}

			meta.lastSyncedAt = now();
			saveMeta();
			setStatus('idle');
		} catch {
			// Offline or logged out: changes stay pending and are retried later.
			saveMeta();
			setStatus('failed');
		}
	}

	// Coalesces calls: at most one run at a time, plus one more if asked meanwhile.
	async function sync(): Promise<void> {
		if (running) {
			rerun = true;
			return running;
		}
		running = (async () => {
			do {
				rerun = false;
				await run();
			} while (rerun);
		})();
		try {
			await running;
		} finally {
			running = undefined;
		}
	}

	return { markChanged, sync };
}
