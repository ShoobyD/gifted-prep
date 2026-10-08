export type Rng = () => number;

// Seedable PRNG (mulberry32) so tests can reproduce a run.
export function seeded(seed: number): Rng {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function randInt(rng: Rng, min: number, max: number): number {
	return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
	return items[Math.floor(rng() * items.length)] as T;
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[result[i], result[j]] = [result[j] as T, result[i] as T];
	}
	return result;
}

// Picks `count` distinct items.
export function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
	return shuffle(rng, items).slice(0, count);
}

let counter = 0;

export function nextId(prefix: string): string {
	return `${prefix}-${++counter}`;
}
