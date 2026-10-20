// The client side of functions/api/profiles: what the children see of each other.

export interface Profile {
	id: string;
	name: string;
	icon: string;
	family: string;
	stars: number;
	stickers: string[];
	streak: number;
	weekStars: number;
	// YYYY-MM-DD, or null before the first finished session.
	lastPractice: string | null;
}

export interface Profiles {
	// The server's today (Israel), which lastPractice is measured against.
	today: string;
	profiles: Profile[];
}

const URL = '/api/profiles';
const TIMEOUT_MS = 15_000;

const isProfile = (value: unknown): value is Profile => {
	const p = value as Partial<Profile> | null;
	return !!p && typeof p.id === 'string' && typeof p.name === 'string' && typeof p.icon === 'string'
		&& typeof p.family === 'string' && typeof p.stars === 'number' && Array.isArray(p.stickers)
		&& typeof p.streak === 'number' && typeof p.weekStars === 'number'
		&& (p.lastPractice === null || typeof p.lastPractice === 'string');
};

// Accepts a list from the server or the local cache only if it has the expected shape.
export function parseProfiles(value: unknown): Profiles | undefined {
	const data = value as Partial<Profiles> | null;
	if (!data || typeof data.today !== 'string' || !Array.isArray(data.profiles) || !data.profiles.every(isProfile)) return undefined;
	return { today: data.today, profiles: data.profiles };
}

// Whole days from one YYYY-MM-DD to another.
export function daysBetween(from: string, to: string): number {
	return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export const profilesApi = {
	async get(): Promise<Profiles> {
		const response = await fetch(URL, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
		if (!response.ok) throw new Error(`GET ${URL}: ${response.status}`);
		const profiles = parseProfiles(await response.json());
		if (!profiles) throw new Error(`GET ${URL}: not a list of profiles`);
		return profiles;
	},
};
