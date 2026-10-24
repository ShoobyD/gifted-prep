<script setup lang="ts">
import { computed } from 'vue';
import StickerArt from '@/components/StickerArt.vue';
import { useChildren } from '@/composables/useChildren';
import { useProgress } from '@/composables/useProgress';
import { useSession } from '@/composables/useSession';
import { useTablet } from '@/composables/useTablet';
import { SESSION_LENGTH } from '@/data/questionSets';
import { STICKERS } from '@/progress/stickers';

// Home is the child's sticker album: the cover carries their name and collection, the
// page has today's pack and the album's slots (the area tabs on its edge come from App).

const { state, streak } = useProgress();
const owned = computed(() => new Set(state.stickers));
const stickerCount = computed(() => STICKERS.filter((s) => owned.value.has(s.id)).length);
const { activeChild } = useChildren();
const session = useSession();
// On a shared tablet: a way to hand over to another child.
const tablet = useTablet();
</script>

<template>
	<!-- The cover's line under the album's name, in the bar above the page. -->
	<Teleport to="#cover-slot" defer>
		<div class="cover-stats">
			<span class="cover-stat">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ic-star" d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z" /></svg>
				{{ state.stars }} כּוֹכָבִים
			</span>
			<span v-if="streak" class="cover-stat">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ic-flame" d="M12 22c-4.4 0-7-2.8-7-6.4 0-3.8 3.2-5.4 3.8-9.6 2.2 1.6 3.2 3.8 3.2 6 1-1 1.6-2.2 1.6-3.8 2.8 2.2 5.4 4.8 5.4 8 0 3.8-2.6 5.8-7 5.8z" /></svg>
				{{ streak }} {{ streak === 1 ? 'יוֹם' : 'יָמִים' }} בָּרֶצֶף
			</span>
		</div>
		<RouterLink class="cover-count" :to="{ name: 'stickers' }" aria-label="הַמַּדְבֵּקוֹת שֶׁלִּי">
			<bdi>{{ stickerCount }}/{{ STICKERS.length }}</bdi>
		</RouterLink>
		<!-- The child's picture; it opens their profile, where they can pick another one. -->
		<RouterLink
			v-if="activeChild && session.authenticated.value"
			class="cover-avatar"
			:to="{ name: 'friend', params: { id: activeChild.id } }"
			aria-label="הַפְּרוֹפִיל שֶׁלִּי"
		>{{ activeChild.icon || '🙂' }}</RouterLink>
	</Teleport>

	<div class="album">
		<!-- A foil sticker packet: crimped shut at both ends, printed with the album's name. -->
		<RouterLink class="pack" :to="{ name: 'practice', params: { set: 'math-mix' } }">
			<span class="pack-print" aria-hidden="true">הָאַלְבּוֹם · מַדְבֵּקוֹת</span>
			<span class="pack-text">
				<strong>חֲבִילָה לְהַיּוֹם</strong>
				<span>שְׁאֵלוֹת חֶשְׁבּוֹן, קְצָת מִכָּל דָּבָר</span>
			</span>
			<span class="pack-burst">
				<svg viewBox="0 0 100 100" aria-hidden="true">
					<path
						d="M50 2l9 14 16-5 1 17 16 4-7 15 11 13-15 7 3 16-17-1-6 16-14-10-14 10-6-16-17 1 3-16-15-7 11-13-7-15 16-4 1-17 16 5z"
						fill="var(--gold)"
						stroke="var(--text)"
						stroke-width="3"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="pack-burst-text"><b>{{ SESSION_LENGTH }}</b>שְׁאֵלוֹת</span>
			</span>
		</RouterLink>

		<RouterLink
			v-if="state.mistakes.length"
			class="review"
			:to="{ name: 'practice', params: { set: 'review' } }"
		>
			<span>חֲזָרָה עַל טָעֻיּוֹת</span>
			<span class="review-count">{{ state.mistakes.length }}</span>
		</RouterLink>

		<section class="collection">
			<h2 class="collection-title">
				<span>הַמַּדְבֵּקוֹת שֶׁלִּי</span>
				<RouterLink class="collection-more" :to="{ name: 'stickers' }">
					{{ stickerCount }} מִתּוֹךְ {{ STICKERS.length }}
				</RouterLink>
			</h2>
			<RouterLink class="slots" :to="{ name: 'stickers' }" aria-label="לְכָל הַמַּדְבֵּקוֹת">
				<span
					v-for="(sticker, i) in STICKERS"
					:key="sticker.id"
					class="slot"
					:class="{ got: owned.has(sticker.id) }"
				>
					<StickerArt v-if="owned.has(sticker.id)" :id="sticker.id" />
					<template v-else>{{ i + 1 }}</template>
				</span>
			</RouterLink>
		</section>

		<button v-if="tablet.isShared.value" type="button" class="switch" @click="tablet.ask()">
			מִישֶׁהוּ אַחֵר מְתַרְגֵּל?
		</button>
	</div>
</template>

<style scoped>
/* The cover: stars and streak under the name, the collection's count in gold. */
.cover-stats {
	grid-column: 1;
	grid-row: 2;
	display: flex;
	flex-wrap: wrap;
	gap: 4px 18px;
	color: var(--on-cover-soft);
	font-size: 18px;
	line-height: 1.3;
}

.cover-stat {
	display: inline-flex;
	align-items: center;
	gap: 6px;
}

.cover-stat svg {
	width: 22px;
	height: 22px;
}

.ic-star {
	fill: var(--gold);
}

.ic-flame {
	fill: var(--flame);
}

.cover-count {
	grid-column: 2;
	grid-row: 1 / span 2;
	color: var(--gold);
	font-family: var(--font-display);
	font-size: 60px;
	font-weight: 700;
	line-height: 1;
	text-decoration: none;
}

.cover-avatar {
	grid-column: 3;
	grid-row: 1 / span 2;
	display: grid;
	place-items: center;
	width: 60px;
	height: 60px;
	border: 3px solid var(--on-cover);
	border-radius: 50%;
	background: var(--surface);
	font-size: 34px;
	line-height: 1;
	text-decoration: none;
}

.cover-avatar:active,
.cover-count:active {
	transform: translateY(2px);
}

.album {
	display: grid;
	gap: 20px;
}

/* The foil: a soft diagonal sheen where it catches the light, and printed dots. The
   crimped ends stand out past its sides, so the page leaves them room. */
.pack {
	--crimp: 26px;
	position: relative;
	display: flex;
	align-items: center;
	min-height: 210px;
	margin-inline: var(--crimp);
	padding: 44px 24px 40px 150px;
	background:
		radial-gradient(circle, rgba(255, 255, 255, .13) 2px, transparent 2.5px) 0 0 / 22px 22px,
		linear-gradient(115deg, #d93560 0%, var(--pack) 40%, #e25a7d 50%, var(--pack) 60%, #b01f45 100%);
	color: var(--on-primary);
	filter: drop-shadow(0 10px 12px rgba(16, 34, 79, .3));
	text-decoration: none;
	/* Back into shape slowly, after a quick squeeze. */
	transition: transform .45s cubic-bezier(.16, 1, .3, 1), filter .45s cubic-bezier(.16, 1, .3, 1);
}

/* The crimped seals: pressed ridges, the outer edge cut in teeth. */
.pack::before,
.pack::after {
	content: "";
	position: absolute;
	top: 0;
	bottom: 0;
	width: var(--crimp);
	background-repeat: repeat-y;
	background-size: var(--crimp) 20px;
}

.pack::before {
	right: calc(-1 * var(--crimp));
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 26 20'%3E%3Cpath d='M0 0h16l10 10-10 10H0z' fill='%239e1b3d'/%3E%3Cpath d='M5 0v20M11 0v20' stroke='%23fff' stroke-opacity='.2' stroke-width='2'/%3E%3C/svg%3E");
}

.pack::after {
	left: calc(-1 * var(--crimp));
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 26 20'%3E%3Cpath d='M26 0H10L0 10l10 10h16z' fill='%239e1b3d'/%3E%3Cpath d='M21 0v20M15 0v20' stroke='%23fff' stroke-opacity='.2' stroke-width='2'/%3E%3C/svg%3E");
}

/* A gold band printed along the bottom. */
.pack-text::after {
	content: "";
	position: absolute;
	right: 0;
	left: 0;
	bottom: 18px;
	height: 6px;
	background: var(--gold);
}

/* Pressed, the packet is squeezed and turns a little between the fingers. */
.pack:active {
	transform: scale(.96) rotate(-1.5deg);
	filter: drop-shadow(0 3px 5px rgba(16, 34, 79, .32));
	transition-duration: .08s;
}

@media (prefers-reduced-motion: reduce) {
	.pack {
		transition: none;
	}

	.pack:active {
		transform: translateY(3px);
	}
}

.pack-print {
	position: absolute;
	top: 12px;
	inset-inline-start: 20px;
	font-family: var(--font-display);
	font-size: 24px;
	font-weight: 700;
	letter-spacing: .04em;
	line-height: 1;
}

.pack-burst {
	position: absolute;
	inset-inline-end: 24px;
	top: 50%;
	display: grid;
	place-items: center;
	width: 112px;
	height: 112px;
	color: var(--text);
	transform: translateY(-50%) rotate(-10deg);
}

.pack-burst svg {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
}

.pack-burst-text {
	position: relative;
	display: grid;
	justify-items: center;
	font-family: var(--font-display);
	font-size: 22px;
	font-weight: 700;
	line-height: 1;
}

.pack-burst-text b {
	font-size: 46px;
}

.pack-text {
	display: grid;
	gap: 6px;
	font-size: 22px;
	line-height: 1.35;
	/* Even lines, never one word left alone on the last. */
	text-wrap: balance;
}

.pack-text strong {
	font-family: var(--font-display);
	font-size: 64px;
	line-height: .95;
}

.review {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	min-height: 72px;
	padding: 0 24px;
	border: 3px solid var(--math);
	border-radius: 18px;
	background: var(--warn-soft);
	color: var(--text);
	font-size: 24px;
	font-weight: 700;
	text-decoration: none;
}

.review:active {
	transform: translateY(2px);
}

.review-count {
	min-width: 44px;
	padding: 0 12px;
	border-radius: 999px;
	background: var(--math);
	color: var(--on-math);
	text-align: center;
}

.collection {
	margin-top: 12px;
}

.collection-title {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	margin: 0 0 16px;
	font-size: 46px;
	line-height: 1;
}

.collection-more {
	color: var(--muted);
	font-family: var(--font);
	font-size: 22px;
	text-decoration: none;
}

.slots {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16px;
	text-decoration: none;
}

.slot {
	display: grid;
	place-items: center;
	/* Upright, the shape of the sticker that goes in it. */
	aspect-ratio: 3 / 4;
	border: 3px dashed var(--line);
	border-radius: 14px;
	color: var(--muted);
	font-family: var(--font-display);
	font-size: 44px;
	font-weight: 700;
	line-height: 1;
}

/* Stuck in by hand: each one a little crooked, and covering its slot. */
.slot.got {
	border-color: transparent;
	transform: rotate(-3deg);
}

.slot.got:nth-child(3n + 2) {
	transform: rotate(2deg);
}

.slot.got:nth-child(4n) {
	transform: rotate(-1deg);
}

.switch {
	justify-self: center;
	min-height: 52px;
	padding: 0 24px;
	border: 2px solid var(--line);
	border-radius: 999px;
	background: var(--surface);
	color: var(--muted);
	font-size: 20px;
}

@media (max-width: 699px) {
	.pack {
		--crimp: 18px;
		min-height: 160px;
		padding: 38px 14px 34px 96px;
	}

	.pack-print {
		font-size: 19px;
	}

	.pack-burst {
		inset-inline-end: 10px;
		width: 80px;
		height: 80px;
	}

	.pack-burst-text {
		font-size: 17px;
	}

	.pack-burst-text b {
		font-size: 32px;
	}

	.pack-text {
		font-size: 18px;
	}

	.pack-text strong {
		font-size: 46px;
	}

	.collection-title {
		font-size: 38px;
	}

	.slots {
		gap: 10px;
	}

	.slot {
		border-radius: 10px;
		font-size: 34px;
	}
}
</style>
