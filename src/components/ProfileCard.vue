<script setup lang="ts">
import { computed } from 'vue';
import { daysBetween, type Profile } from '@/family/profilesApi';
import { earnedStickers } from '@/progress/stickers';

// One child's achievements: on the friends screen and at the top of a profile.
const props = defineProps<{ profile: Profile; today: string; me?: boolean }>();
const stickers = computed(() => earnedStickers(props.profile.stickers).length);

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
	<article class="card" :class="{ me }">
		<header class="who">
			<span class="icon" aria-hidden="true">{{ profile.icon || '🙂' }}</span>
			<span class="names">
				<span class="name">{{ profile.name }}<span v-if="me" class="badge">אֲנִי</span></span>
				<span class="family">{{ profile.family }}</span>
			</span>
		</header>
		<dl class="stats">
			<div><dt>כּוֹכָבִים</dt><dd>⭐ {{ profile.stars }}</dd></div>
			<div><dt>רֶצֶף יָמִים</dt><dd>🔥 {{ profile.streak }}</dd></div>
			<div><dt>הַשָּׁבוּעַ</dt><dd>✨ {{ profile.weekStars }}</dd></div>
			<div><dt>מַדְבֵּקוֹת</dt><dd>🎖️ {{ stickers }}</dd></div>
		</dl>
		<p class="last">{{ lastPractice }}</p>
	</article>
</template>

<style scoped>
.card {
	display: grid;
	gap: 12px;
	padding: 16px;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
	color: var(--text);
}

.card.me {
	outline: 3px solid var(--primary);
}

.who {
	display: flex;
	align-items: center;
	gap: 12px;
}

.icon {
	font-size: 48px;
	line-height: 1;
}

.names {
	display: grid;
}

.name {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 24px;
	font-weight: 700;
}

.badge {
	padding: 0 10px;
	border-radius: 999px;
	background: var(--primary);
	color: #fff;
	font-size: 15px;
}

.family {
	color: var(--muted);
	font-size: 15px;
}

.stats {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 6px;
	margin: 0;
	text-align: center;
}

.stats dt {
	color: var(--muted);
	font-size: 13px;
}

.stats dd {
	margin: 0;
	font-size: 20px;
	font-weight: 700;
	white-space: nowrap;
}

.last {
	margin: 0;
	color: var(--muted);
	font-size: 16px;
}
</style>
