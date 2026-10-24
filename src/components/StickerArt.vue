<script setup lang="ts">
import { computed } from 'vue';
import { STICKERS } from '@/progress/stickers';

// A sticker's picture, shaped like a collector's album sticker: upright (3:4), a colored
// panel with one drawn shape (white with a dark outline) above a white strip printed with
// its slot number in the album, all inside a white die-cut edge. The shapes are drawn on
// a 100×100 square, fitted into the panel.
const props = defineProps<{ id: string }>();

// Its slot in the album: its place in the list of all stickers.
const slot = computed(() => STICKERS.findIndex((s) => s.id === props.id) + 1);

const INK = '#10224f';

// A line drawn as a white stroke with a dark outline, like the filled shapes.
const line = (d: string) =>
	`<path d="${d}" fill="none" stroke="${INK}" stroke-width="12"/><path d="${d}" fill="none" stroke="#fff" stroke-width="5"/>`;

const STAR = 'M50 20l9 19 21 3-15 14 4 21-19-10-19 10 4-21-15-14 21-3z';

interface Art {
	color: string;
	shape: string;
}

const ART: Record<string, Art> = {
	'first-session': {
		color: '#0f8a64',
		shape: `${line('M50 82V52M32 82h36')}
			<path d="M50 58c-4-14-16-20-28-18 0 12 12 20 28 18z"/>
			<path d="M50 50c2-14 14-22 28-20 0 14-12 22-28 20z"/>`,
	},
	perfect: {
		color: '#d6305f',
		shape: `<circle cx="48" cy="52" r="30"/>
			<circle cx="48" cy="52" r="19" fill="currentColor"/>
			<circle cx="48" cy="52" r="8"/>
			${line('M48 52l26-26M66 22h10v10')}`,
	},
	'stars-50': {
		color: '#ffb000',
		shape: `<path d="${STAR}"/>`,
	},
	'stars-200': {
		color: '#e0731a',
		shape: `<path d="${STAR}" transform="translate(-6 6)"/>
			<path d="${STAR}" transform="translate(52 6) scale(.42)" vector-effect="non-scaling-stroke"/>`,
	},
	'stars-500': {
		color: '#6b4ae6',
		shape: `${line('M16 30l20 12M12 50l22 6M18 70l18 0')}
			<path d="${STAR}" transform="translate(28 14) scale(.78)" vector-effect="non-scaling-stroke"/>`,
	},
	'streak-3': {
		color: '#d43a3a',
		shape: `<path d="M50 84c-16 0-26-10-26-24 0-14 12-20 14-36 8 6 12 14 12 22 4-4 6-8 6-14 10 8 20 18 20 30 0 14-10 22-26 22z"/>
			<path d="M50 84c-7 0-12-5-12-11 0-7 6-10 8-16 6 5 15 10 15 17 0 6-4 10-11 10z" fill="currentColor"/>`,
	},
	'streak-7': {
		color: '#1446a0',
		shape: `${line('M34 30H24c0 10 5 16 12 16M66 30h10c0 10-5 16-12 16')}
			<path d="M34 22h32v14c0 12-7 20-16 20s-16-8-16-20z"/>
			<path d="M45 56h10v12H45z"/>
			<path d="M33 68h34v12H33z"/>`,
	},
	'sessions-10': {
		color: '#1aa3b5',
		shape: `${line('M40 28v-4a10 10 0 0 1 20 0v4')}
			<rect x="27" y="28" width="46" height="54" rx="13"/>
			<rect x="36" y="56" width="28" height="18" rx="5" fill="currentColor"/>
			${line('M27 46h46')}`,
	},
	'sessions-30': {
		color: '#e83f6f',
		shape: `<path d="M50 16c-14 0-24 10-24 23 0 9 5 14 10 19 2 2 3 5 3 9h22c0-4 1-7 3-9 5-5 10-10 10-19 0-13-10-23-24-23z"/>
			<path d="M39 67h22v8H39zM43 75h14v7H43z"/>
			${line('M44 44l6 8 6-8')}`,
	},
	'reader-5': {
		color: '#d6305f',
		shape: `<path d="M50 30c-8-6-20-8-30-6v48c10-2 22 0 30 6 8-6 20-8 30-6V24c-10-2-22 0-30 6z"/>
			${line('M50 32v44')}`,
	},
	'reader-15': {
		color: '#8a5a2b',
		shape: `<path d="M24 26l12 10c4-2 9-3 14-3s10 1 14 3l12-10v34c0 14-12 24-26 24S24 74 24 60z"/>
			<circle cx="39" cy="51" r="10"/>
			<circle cx="61" cy="51" r="10"/>
			<circle cx="39" cy="51" r="4" fill="${INK}"/>
			<circle cx="61" cy="51" r="4" fill="${INK}"/>
			<path d="M46 63l4 7 4-7z" fill="currentColor"/>`,
	},
	'review-10': {
		color: '#0f8a64',
		shape: line('M28 48a22 22 0 0 1 40-12M70 24v13H57M72 52a22 22 0 0 1-40 12M30 76V63h13'),
	},
	'mock-test': {
		color: '#6b4ae6',
		shape: `<path d="M30 16h28l14 14v54H30z"/>
			<path d="M58 16v14h14" fill="none"/>
			<path d="M38 42h24M38 52h24M38 62h12" fill="none"/>
			${line('M52 70l6 6 12-14')}`,
	},
	'mock-90': {
		color: '#1446a0',
		shape: `<path d="M32 46v16c0 6 8 10 18 10s18-4 18-10V46z"/>
			<path d="M50 24l36 15-36 15-36-15z"/>
			${line('M80 42v18')}
			<circle cx="80" cy="64" r="5"/>`,
	},
	'level-3': {
		color: '#e0731a',
		shape: `<path d="M42 64l-2 18 10-6 10 6-2-18z" fill="${INK}"/>
			<path d="M37 46l-12 14v12l14-7zM63 46l12 14v12l-14-7z"/>
			<path d="M50 14c13 10 17 26 14 52H36c-3-26 1-42 14-52z"/>
			<circle cx="50" cy="38" r="7" fill="currentColor"/>`,
	},
	'all-level-3': {
		color: '#ffb000',
		shape: `<path d="M22 68l-4-38 18 16 14-24 14 24 18-16-4 38z"/>
			<path d="M22 68h56v12H22z"/>
			<circle cx="50" cy="54" r="5" fill="currentColor"/>`,
	},
};

// A sticker without a picture yet still gets a tile.
const art = computed<Art>(() => ART[props.id] ?? { color: '#5a6b96', shape: `<path d="${STAR}"/>` });
</script>

<template>
	<svg class="sticker-art" viewBox="0 0 100 133" aria-hidden="true">
		<rect x="2" y="2" width="96" height="129" rx="12" fill="#fff" />
		<rect x="8" y="8" width="84" height="96" rx="8" :fill="art.color" />
		<!-- The shapes are the app's own drawings above. -->
		<g
			transform="translate(6 8) scale(.88)"
			:style="{ color: art.color }"
			fill="#fff"
			:stroke="INK"
			stroke-width="4"
			stroke-linejoin="round"
			stroke-linecap="round"
			v-html="art.shape"
		/>
		<!-- The strip at its foot: the slot number at the start of the line (right). -->
		<path class="strip" d="M14 117h48" />
		<text v-if="slot" class="num" x="86" y="125" text-anchor="end" :fill="INK">{{ slot }}</text>
	</svg>
</template>

<style scoped>
.sticker-art {
	display: block;
	width: 100%;
	height: auto;
	filter: drop-shadow(0 4px 6px rgba(16, 34, 79, .28));
}

.strip {
	stroke: var(--line);
	stroke-width: 3;
	stroke-linecap: round;
}

.num {
	font-family: var(--font-display);
	font-size: 26px;
	font-weight: 700;
}
</style>
