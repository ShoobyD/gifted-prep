<script setup lang="ts">
import { computed } from 'vue';
import { STICKERS } from '@/progress/stickers';

// Every sticker there is: the earned ones in color, the rest locked with how to earn them.
const props = defineProps<{ earned: string[] }>();
const owned = computed(() => new Set(props.earned));
</script>

<template>
	<div class="grid">
		<div v-for="sticker in STICKERS" :key="sticker.id" class="sticker" :class="{ locked: !owned.has(sticker.id) }">
			<span class="emoji" aria-hidden="true">{{ owned.has(sticker.id) ? sticker.emoji : '🔒' }}</span>
			<span class="name">{{ sticker.name }}</span>
			<span class="hint">{{ sticker.hint }}</span>
		</div>
	</div>
</template>

<style scoped>
.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 16px;
}

.sticker {
	display: grid;
	justify-items: center;
	gap: 4px;
	padding: 16px 12px;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
	text-align: center;
}

.locked {
	opacity: .55;
}

.emoji {
	font-size: 56px;
	line-height: 1.2;
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
