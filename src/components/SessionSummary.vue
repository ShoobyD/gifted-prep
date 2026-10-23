<script setup lang="ts">
import { computed } from 'vue';
import { useChildren } from '@/composables/useChildren';
import type { Sticker } from '@/progress/stickers';

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
	if (ratio === 1) return name ? `מֻשְׁלָם, ${name}! 🎉` : 'מֻשְׁלָם! 🎉';
	if (ratio >= 0.7) return name ? `כָּל הַכָּבוֹד, ${name}! 🎉` : 'כָּל הַכָּבוֹד! 🎉';
	return name ? `אִמּוּן טוֹב, ${name}! כָּל תִּרְגּוּל מְחַזֵּק 💪` : 'סִיַּמְתֶּם! כָּל תִּרְגּוּל מְחַזֵּק 💪';
});
</script>

<template>
	<section class="summary">
		<p class="title">{{ title }}</p>
		<p class="score">{{ correct }} מִתּוֹךְ {{ total }} נְכוֹנוֹת</p>
		<p class="stars">+{{ stars }} ⭐</p>

		<div v-if="stickers.length" class="new-stickers">
			<p class="new-title">מַדְבֵּקָה חֲדָשָׁה!</p>
			<div v-for="sticker in stickers" :key="sticker.id" class="sticker">
				<span class="sticker-emoji">{{ sticker.emoji }}</span>
				<span>{{ sticker.name }}</span>
			</div>
		</div>

		<div class="actions">
			<button type="button" class="btn btn--primary" @click="emit('again')">עוֹד סְבָב 🔁</button>
			<RouterLink class="btn" :to="{ name: 'home' }" replace>לְמָסַךְ הַבַּיִת</RouterLink>
		</div>
	</section>
</template>

<style scoped>
.summary {
	display: grid;
	justify-items: center;
	gap: 12px;
	margin-top: 32px;
	text-align: center;
}

.title {
	margin: 0;
	font-size: 36px;
	font-weight: 700;
}

.score {
	margin: 0;
	font-size: 28px;
}

.stars {
	margin: 0;
	font-size: 40px;
	font-weight: 700;
	animation: pop .6s;
}

.new-stickers {
	display: grid;
	justify-items: center;
	gap: 8px;
	padding: 16px 32px;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
}

.new-title {
	margin: 0;
	font-weight: 700;
	color: var(--primary);
}

.sticker {
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 24px;
}

.sticker-emoji {
	font-size: 56px;
	animation: pop .8s;
}

.actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 16px;
	margin-top: 16px;
}

.btn {
	min-height: 64px;
	padding: 0 28px;
	border: 0;
	border-radius: 18px;
	background: var(--surface);
	color: var(--text);
	font-size: 24px;
	font-weight: 700;
	line-height: 64px;
	text-decoration: none;
	box-shadow: var(--shadow);
}

.btn--primary {
	background: var(--primary);
	color: #fff;
}
</style>
