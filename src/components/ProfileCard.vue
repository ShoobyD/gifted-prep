<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';
import { daysBetween, type Profile } from '@/family/profilesApi';
import { earnedStickers } from '@/progress/stickers';

// One child's achievements, as a player sticker in a collector's album: their picture on
// their own color, a name plate, and what they collected. On the friends screen and at the
// top of a profile.
const props = defineProps<{ profile: Profile; today: string; me?: boolean }>();
const stickers = computed(() => earnedStickers(props.profile.stickers).length);

// Each child keeps one color, picked from their id: the same on every screen and tablet.
const COLORS = ['#d6305f', '#ffb000', '#0f8a64', '#6b4ae6', '#1aa3b5', '#e0731a', '#1446a0', '#e83f6f'];
const color = computed(() => {
	let hash = 0;
	for (const ch of props.profile.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
	return COLORS[hash % COLORS.length];
});

// Neutral wording ("practice", not "practiced"): the children are boys and girls.
const lastPractice = computed(() => {
	if (!props.profile.lastPractice) return 'עוֹד אֵין אִמּוּנִים';
	const days = daysBetween(props.profile.lastPractice, props.today);
	if (days <= 0) return 'אִמּוּן אַחֲרוֹן: הַיּוֹם';
	if (days === 1) return 'אִמּוּן אַחֲרוֹן: אֶתְמוֹל';
	if (days === 2) return 'אִמּוּן אַחֲרוֹן: לִפְנֵי יוֹמַיִם';
	return `אִמּוּן אַחֲרוֹן: לִפְנֵי ${days} יָמִים`;
});
</script>

<template>
	<article class="card" :class="{ me }" :style="{ '--card': color }">
		<div class="portrait">
			<span class="icon" aria-hidden="true">{{ profile.icon || '🙂' }}</span>
			<span v-if="me" class="badge">אֲנִי</span>
		</div>
		<header class="plate">
			<span class="name">{{ profile.name }}</span>
			<span class="family">{{ profile.family }}</span>
		</header>
		<dl class="stats">
			<div><dt>כּוֹכָבִים</dt><dd><AppIcon name="star" class="ic ic--star" />{{ profile.stars }}</dd></div>
			<div><dt>רֶצֶף יָמִים</dt><dd><AppIcon name="flame" class="ic ic--flame" />{{ profile.streak }}</dd></div>
			<div><dt>הַשָּׁבוּעַ</dt><dd><AppIcon name="sparkle" class="ic ic--week" />{{ profile.weekStars }}</dd></div>
			<div><dt>מַדְבֵּקוֹת</dt><dd><AppIcon name="sticker" class="ic ic--sticker" />{{ stickers }}</dd></div>
		</dl>
		<p class="last">{{ lastPractice }}</p>
	</article>
</template>

<style scoped>
/* A sticker: white die-cut edge, lifted off the page. */
.card {
	display: grid;
	overflow: hidden;
	border: 6px solid var(--surface);
	border-radius: 20px;
	background: var(--surface);
	box-shadow: 0 6px 16px rgba(16, 34, 79, .22), 0 0 0 1px var(--line-soft);
	color: var(--text);
	/* The stats lay out by the card's own width, not the screen's. */
	container-type: inline-size;
}

.card.me {
	box-shadow: 0 6px 16px rgba(16, 34, 79, .22), 0 0 0 4px var(--primary);
}

.portrait {
	position: relative;
	display: grid;
	place-items: center;
	height: 120px;
	border-radius: 14px 14px 0 0;
	background: var(--card);
}

.icon {
	font-size: 72px;
	line-height: 1;
	filter: drop-shadow(0 4px 4px rgba(0, 0, 0, .2));
}

.badge {
	position: absolute;
	top: 10px;
	inset-inline-start: 10px;
	padding: 2px 12px;
	border-radius: 999px;
	background: var(--surface);
	color: var(--primary);
	font-size: 15px;
	font-weight: 700;
}

/* The name plate across the bottom of the picture. */
.plate {
	display: grid;
	justify-items: center;
	padding: 8px 12px 4px;
	text-align: center;
}

.name {
	font-family: var(--font-display);
	font-size: 40px;
	font-weight: 700;
	line-height: 1;
}

.family {
	color: var(--muted);
	font-size: 15px;
}

.stats {
	display: grid;
	/* Four in a row; on a narrow card two by two, never one left alone on a row. */
	grid-template-columns: repeat(4, 1fr);
	gap: 6px;
	margin: 8px 12px 0;
	padding-top: 10px;
	border-top: 2px dashed var(--line-soft);
	text-align: center;
}

@container (max-width: 290px) {
	.stats {
		grid-template-columns: repeat(2, 1fr);
		row-gap: 10px;
	}
}

.stats dt {
	color: var(--muted);
	font-size: 13px;
}

.stats dd {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
	margin: 0;
	font-size: 20px;
	font-weight: 700;
	white-space: nowrap;
	font-variant-numeric: tabular-nums;
}

.ic {
	font-size: 18px;
}

.ic--star,
.ic--flame,
.ic--week {
	stroke: none;
}

.ic--star :deep(path),
.ic--flame :deep(path),
.ic--week :deep(path) {
	fill: currentColor;
}

.ic--star { color: var(--math); }
.ic--flame { color: var(--flame); }
.ic--week { color: var(--parents); }
.ic--sticker { color: var(--good); }

.last {
	margin: 8px 12px 12px;
	color: var(--muted);
	font-size: 16px;
	text-align: center;
}
</style>
