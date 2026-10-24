<script setup lang="ts">
import { computed } from 'vue';
import StickerArt from '@/components/StickerArt.vue';
import { STICKERS } from '@/progress/stickers';

// Every sticker there is, in its numbered slot: the earned ones stuck in, the rest an empty
// slot with how to earn them.
const props = defineProps<{ earned: string[] }>();
const owned = computed(() => new Set(props.earned));
</script>

<template>
	<div class="grid">
		<div v-for="(sticker, i) in STICKERS" :key="sticker.id" class="sticker" :class="{ locked: !owned.has(sticker.id) }">
			<StickerArt v-if="owned.has(sticker.id)" :id="sticker.id" class="art" />
			<span v-else class="slot" aria-hidden="true">{{ i + 1 }}</span>
			<span class="name">{{ sticker.name }}</span>
			<span class="hint">{{ sticker.hint }}</span>
		</div>
	</div>
</template>

<style scoped>
.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(160px, 45%), 1fr));
	gap: 28px 16px;
}

/* Straight on the page, like a printed album: the slot, its name and how to earn it. */
.sticker {
	display: grid;
	justify-items: center;
	align-content: start;
	gap: 4px;
	text-align: center;
}

.art,
.slot {
	width: 90px;
	margin-bottom: 6px;
}

/* Stuck in by hand: each one a little crooked. */
.art {
	transform: rotate(-3deg);
}

.sticker:nth-child(3n + 2) .art {
	transform: rotate(2deg);
}

.sticker:nth-child(3n) .art {
	transform: rotate(-1deg);
}

.slot {
	display: grid;
	place-items: center;
	aspect-ratio: 3 / 4;
	border: 3px dashed var(--line);
	border-radius: 14px;
	color: var(--muted);
	font-family: var(--font-display);
	font-size: 44px;
	font-weight: 700;
	line-height: 1;
}

.locked .name {
	color: var(--muted);
}

.name {
	font-weight: 700;
}

.hint {
	color: var(--muted);
	font-size: 16px;
	line-height: 1.4;
}
</style>
