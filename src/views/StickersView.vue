<script setup lang="ts">
import { useProgress } from '@/composables/useProgress';
import { STICKERS } from '@/progress/stickers';

const { state } = useProgress();
</script>

<template>
	<p class="count">אָסַפְתָּ {{ state.stickers.length }} מִתּוֹךְ {{ STICKERS.length }} מַדְבֵּקוֹת</p>
	<div class="grid">
		<div
			v-for="sticker in STICKERS"
			:key="sticker.id"
			class="sticker"
			:class="{ locked: !state.stickers.includes(sticker.id) }"
		>
			<span class="emoji" aria-hidden="true">{{ state.stickers.includes(sticker.id) ? sticker.emoji : '🔒' }}</span>
			<span class="name">{{ sticker.name }}</span>
			<span class="hint">{{ sticker.hint }}</span>
		</div>
	</div>
</template>

<style scoped>
.count {
	margin: 0 0 20px;
	text-align: center;
	font-size: 26px;
}

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
