<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import StickerArt from '@/components/StickerArt.vue';
import { useChildren } from '@/composables/useChildren';
import { STICKERS, type Sticker } from '@/progress/stickers';

// The round's end is opening its pack: the strip tears off, the stars come out, and a new
// sticker drops into its numbered slot in the album.
const props = defineProps<{
	correct: number;
	total: number;
	stars: number;
	stickers: Sticker[];
}>();

const emit = defineEmits<{ again: [] }>();

const { activeChild } = useChildren();

// Praise effort, not only the score; by name when the app knows it.
const title = computed(() => {
	const name = activeChild.value?.name;
	const ratio = props.total ? props.correct / props.total : 0;
	if (ratio === 1) return name ? `מֻשְׁלָם, ${name}!` : 'מֻשְׁלָם!';
	if (ratio >= 0.7) return name ? `כָּל הַכָּבוֹד, ${name}!` : 'כָּל הַכָּבוֹד!';
	return name ? `אִמּוּן טוֹב, ${name}!` : 'סִיַּמְתֶּם!';
});

const subtitle = computed(() =>
	props.total && props.correct / props.total < 0.7 ? 'כָּל תִּרְגּוּל מְחַזֵּק' : '');

// Each new sticker with its slot number in the album.
const landed = computed(() =>
	props.stickers.map((sticker) => ({ sticker, slot: STICKERS.findIndex((s) => s.id === sticker.id) + 1 })));

// The pack's torn strip: a straight top and a serrated edge where it tears.
const STRIP = `M12 8h96v20${'l-6 6-6-6'.repeat(8)}z`;
// Its other end, crimped shut: ridged, the bottom edge cut in teeth.
const SEAL = `M12 136h96v12${'l-6 6-6-6'.repeat(8)}z`;
</script>

<template>
	<section class="summary">
		<h2 class="title">{{ title }}</h2>
		<p class="score">
			{{ correct }} מִתּוֹךְ {{ total }} נְכוֹנוֹת<template v-if="subtitle"> · {{ subtitle }}</template>
		</p>

		<div class="opening">
			<!-- The same foil packet as on the album's first page, stood upright. -->
			<svg class="pack" viewBox="0 0 120 160" aria-hidden="true">
				<defs>
					<linearGradient id="pack-sheen" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stop-color="#d93560" />
						<stop offset=".42" stop-color="#c8264f" />
						<stop offset=".5" stop-color="#e25a7d" />
						<stop offset=".58" stop-color="#c8264f" />
						<stop offset="1" stop-color="#b01f45" />
					</linearGradient>
					<pattern id="pack-dots" width="11" height="11" patternUnits="userSpaceOnUse">
						<circle cx="2" cy="2" r="1" fill="#fff" opacity=".14" />
					</pattern>
				</defs>
				<rect x="12" y="26" width="96" height="112" fill="url(#pack-sheen)" />
				<rect x="12" y="26" width="96" height="112" fill="url(#pack-dots)" />
				<text class="pack-print" x="102" y="42" text-anchor="start">הָאַלְבּוֹם</text>
				<path
					class="pack-star"
					d="M60 58l9 19 21 3-15 14 4 21-19-10-19 10 4-21-15-14 21-3z"
				/>
				<path class="pack-band" d="M12 126h96" />
				<path class="pack-seal" :d="SEAL" />
				<path class="pack-ridges" d="M12 140h96M12 145h96" />
				<path class="pack-strip" :d="STRIP" />
			</svg>

			<p v-if="stars" class="stars">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z" /></svg>
				+{{ stars }} {{ stars === 1 ? 'כּוֹכָב' : 'כּוֹכָבִים' }}
			</p>
		</div>

		<div v-if="landed.length" class="album-row">
			<p class="new-title">{{ landed.length === 1 ? 'מַדְבֵּקָה חֲדָשָׁה לָאַלְבּוֹם!' : 'מַדְבֵּקוֹת חֲדָשׁוֹת לָאַלְבּוֹם!' }}</p>
			<div class="slots">
				<div
					v-for="({ sticker, slot }, i) in landed"
					:key="sticker.id"
					class="slot-wrap"
					:style="{ '--delay': `${1.5 + i * 0.5}s` }"
				>
					<div class="slot">
						<span class="slot-num" aria-hidden="true">{{ slot }}</span>
						<StickerArt :id="sticker.id" class="landing" />
					</div>
					<span class="sticker-name">{{ sticker.name }}</span>
				</div>
			</div>
		</div>

		<div class="actions">
			<button type="button" class="btn btn--primary" @click="emit('again')">
				<AppIcon name="retry" />
				עוֹד סְבָב
			</button>
			<RouterLink class="btn" :to="{ name: 'home' }" replace>לָאַלְבּוֹם</RouterLink>
		</div>
	</section>
</template>

<style scoped>
.summary {
	display: grid;
	justify-items: center;
	gap: 12px;
	margin-top: 16px;
	text-align: center;
}

.title {
	margin: 0;
	font-size: 64px;
	line-height: 1;
}

.score {
	margin: 0;
	color: var(--muted);
	font-size: 24px;
}

/* The pack: in, a shake, the strip torn off, the stars out. */
.opening {
	display: grid;
	justify-items: center;
	margin: 12px 0 4px;
}

.pack {
	width: 150px;
	height: auto;
	filter: drop-shadow(0 10px 14px rgba(16, 34, 79, .3));
	animation: pack-in .5s cubic-bezier(.16, 1, .3, 1) both, pack-shake .4s .5s ease-in-out;
}

.pack-print {
	fill: #fff;
	font-family: var(--font-display);
	font-size: 12px;
	font-weight: 700;
}

.pack-band {
	stroke: var(--gold);
	stroke-width: 4;
}

.pack-seal {
	fill: #9e1b3d;
}

.pack-ridges {
	stroke: rgba(255, 255, 255, .2);
	stroke-width: 1.5;
}

.pack-star {
	fill: var(--gold);
	stroke: var(--text);
	stroke-width: 4;
	stroke-linejoin: round;
}

.pack-strip {
	fill: #9e1b3d;
	transform-box: fill-box;
	transform-origin: 100% 100%;
	animation: tear .6s .9s cubic-bezier(.5, 0, .75, 0) both;
}

.stars {
	display: flex;
	align-items: center;
	gap: 10px;
	margin: -18px 0 0;
	padding: 8px 22px;
	border-radius: 999px;
	background: var(--gold);
	color: var(--text);
	font-size: 30px;
	font-weight: 700;
	box-shadow: var(--shadow);
	animation: rise .6s 1.2s cubic-bezier(.16, 1, .3, 1) both;
}

.stars svg {
	width: 30px;
	height: 30px;
	fill: var(--text);
}

/* The album's slots, with the new stickers dropping into them. */
.album-row {
	display: grid;
	justify-items: center;
	gap: 12px;
	margin-top: 8px;
}

.new-title {
	margin: 0;
	font-family: var(--font-display);
	font-size: 40px;
	font-weight: 700;
	line-height: 1;
	color: var(--pack);
}

.slots {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 20px;
}

.slot-wrap {
	display: grid;
	justify-items: center;
	gap: 8px;
	width: 140px;
}

.slot {
	position: relative;
	display: grid;
	place-items: center;
	width: 108px;
	aspect-ratio: 3 / 4;
	border: 3px dashed var(--line);
	border-radius: 14px;
}

.slot-num {
	color: var(--muted);
	font-family: var(--font-display);
	font-size: 48px;
	font-weight: 700;
	line-height: 1;
}

.landing {
	position: absolute;
	inset: -3px;
	width: calc(100% + 6px);
	animation: land .7s var(--delay) cubic-bezier(.34, 1.4, .64, 1) both;
}

.sticker-name {
	font-size: 22px;
	font-weight: 700;
	line-height: 1.3;
	animation: rise .4s calc(var(--delay) + .5s) ease-out both;
}

.actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 16px;
	margin-top: 20px;
}

.btn {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 64px;
	padding: 0 28px;
	border: 3px solid var(--line);
	border-radius: 18px;
	background: var(--surface);
	color: var(--text);
	font-size: 24px;
	font-weight: 700;
	text-decoration: none;
	box-shadow: var(--shadow-sm);
}

.btn:active {
	transform: translateY(2px);
}

.btn--primary {
	border-color: var(--primary);
	background: var(--primary);
	color: var(--on-primary);
}

@keyframes pack-in {
	from { transform: translateY(40px) scale(.8); opacity: 0; }
}

@keyframes pack-shake {
	25% { transform: rotate(-5deg); }
	75% { transform: rotate(5deg); }
}

@keyframes tear {
	to { transform: translate(-30px, -50px) rotate(-25deg); opacity: 0; }
}

@keyframes rise {
	from { transform: translateY(24px); opacity: 0; }
}

/* From up at the pack, down into the slot, pressed in with a tilt. */
@keyframes land {
	from { transform: translateY(-220px) scale(1.4) rotate(14deg); opacity: 0; }
	30% { opacity: 1; }
	to { transform: rotate(-4deg); }
}

@media (max-width: 699px) {
	.title {
		font-size: 48px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.pack,
	.pack-strip,
	.stars,
	.landing,
	.sticker-name {
		animation: none;
	}

	.pack-strip {
		opacity: 0;
	}

	.landing {
		transform: rotate(-4deg);
	}
}
</style>
