import type { Env } from './types';

// What children see of each other (across all families): achievements only. Never success
// rates, mistakes, sessions or settings.

export interface Profile {
	id: string;
	name: string;
	icon: string;
	family: string;
	stars: number;
	stickers: string[];
	// Consecutive practice days ending today or yesterday, as on the child's own home screen.
	streak: number;
	// Stars from sessions finished since Sunday.
	weekStars: number;
	// The last day with a finished session (YYYY-MM-DD), or null.
	lastPractice: string | null;
}

// Days are counted in Israel, where all the families are.
const TIME_ZONE = 'Asia/Jerusalem';
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

export const israelDate = (date: Date): string => dayFormat.format(date);

// Day arithmetic on YYYY-MM-DD strings, free of time zones.
function addDays(day: string, delta: number): string {
	const date = new Date(`${day}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + delta);
	return date.toISOString().slice(0, 10);
}

function streakOf(practiceDays: string[], today: string): number {
	const days = new Set(practiceDays);
	let cursor = days.has(today) ? today : addDays(today, -1);
	let streak = 0;
	while (days.has(cursor)) {
		streak++;
		cursor = addDays(cursor, -1);
	}
	return streak;
}

const numberOr0 = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);

// The achievements in a stored progress document (missing or broken parts count as none).
export function summarize(data: string | null, today: string): Omit<Profile, 'id' | 'name' | 'icon' | 'family'> {
	let progress: Record<string, unknown> = {};
	try {
		const parsed = data ? (JSON.parse(data) as unknown) : null;
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) progress = parsed as Record<string, unknown>;
	} catch {
		// A broken document shows as no achievements, never as an error for everyone.
	}
	const practiceDays = strings(progress.practiceDays).sort();
	const sunday = addDays(today, -new Date(`${today}T00:00:00Z`).getUTCDay());
	const sessions = Array.isArray(progress.sessions) ? progress.sessions as { at?: unknown; stars?: unknown }[] : [];
	const weekStars = sessions
		.filter((s) => typeof s?.at === 'string' && !Number.isNaN(Date.parse(s.at)) && israelDate(new Date(s.at)) >= sunday)
		.reduce((sum, s) => sum + numberOr0(s.stars), 0);
	return {
		stars: numberOr0(progress.stars),
		stickers: strings(progress.stickers),
		streak: streakOf(practiceDays, today),
		weekStars,
		lastPractice: practiceDays.at(-1) ?? null,
	};
}

interface Row {
	id: string;
	name: string;
	icon: string;
	family: string;
	data: string | null;
}

// Every child of every family: the admin family first, then by when each family joined;
// within a family, in the family's own order. A fixed order, never a ranking.
export async function listProfiles(env: Env, now: Date): Promise<{ today: string; profiles: Profile[] }> {
	const { results } = await env.DB.prepare(
		`SELECT c.id, c.name, c.icon, f.name AS family, p.data
		FROM children c
		JOIN families f ON f.id = c.family_id
		LEFT JOIN progress p ON p.id = c.id
		ORDER BY f.is_admin DESC, f.created_at, c.position, c.created_at`,
	).all<Row>();
	const today = israelDate(now);
	return {
		today,
		profiles: results.map((row) => ({ id: row.id, name: row.name, icon: row.icon, family: row.family, ...summarize(row.data, today) })),
	};
}
