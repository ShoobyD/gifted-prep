<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { useProgress } from '@/composables/useProgress';

const { state, streak } = useProgress();

interface MenuItem {
	to: RouteLocationRaw;
	icon: string;
	label: string;
	color: string;
}

const items: MenuItem[] = [
	{ to: { name: 'reading' }, icon: '📖', label: 'הֲבָנַת הַנִּקְרָא', color: 'var(--reading)' },
	{ to: { name: 'math' }, icon: '🔢', label: 'חֶשְׁבּוֹן', color: 'var(--math)' },
	{ to: { name: 'test' }, icon: '📝', label: 'מִבְחַן דֻּגְמָה', color: 'var(--test)' },
];
</script>

<template>
	<RouterLink class="status" :to="{ name: 'stickers' }">
		<span class="stat">⭐ {{ state.stars }}</span>
		<span v-if="streak" class="stat">🔥 {{ streak }} {{ streak === 1 ? 'יוֹם' : 'יָמִים' }}</span>
		<span class="stat">🎖️ {{ state.stickers.length }} מַדְבֵּקוֹת</span>
	</RouterLink>
	<p class="greeting">שָׁלוֹם! בְּמָה נִתְאַמֵּן הַיּוֹם?</p>
	<RouterLink
		v-if="state.mistakes.length"
		class="review"
		:to="{ name: 'practice', params: { set: 'review' } }"
	>
		<span class="review-icon" aria-hidden="true">🔁</span>
		<span>חֲזָרָה עַל טָעֻיּוֹת</span>
		<span class="review-count">{{ state.mistakes.length }}</span>
	</RouterLink>
	<nav class="menu">
		<RouterLink
			v-for="item in items"
			:key="item.label"
			:to="item.to"
			class="menu-btn"
			:style="{ borderBottomColor: item.color }"
		>
			<span class="menu-icon" aria-hidden="true">{{ item.icon }}</span>
			<span class="menu-label">{{ item.label }}</span>
		</RouterLink>
	</nav>
</template>

<style scoped>
.status {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 12px 28px;
	margin: 0 auto 20px;
	padding: 10px 24px;
	width: fit-content;
	border-radius: 999px;
	background: var(--surface);
	box-shadow: var(--shadow);
	color: inherit;
	font-size: 24px;
	font-weight: 700;
	text-decoration: none;
}

.greeting {
	margin: 0 0 24px;
	font-size: 28px;
	text-align: center;
}

.review {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14px;
	min-height: 80px;
	margin-bottom: 20px;
	border-radius: var(--radius);
	background: var(--warn);
	color: var(--text);
	font-size: 26px;
	font-weight: 700;
	text-decoration: none;
	box-shadow: var(--shadow);
}

.review:active {
	transform: translateY(3px);
}

.review-icon {
	font-size: 36px;
}

.review-count {
	min-width: 40px;
	padding: 0 10px;
	border-radius: 999px;
	background: var(--surface);
	font-size: 22px;
	text-align: center;
}

.menu {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20px;
}

.menu-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 180px;
	padding: 20px;
	border-radius: var(--radius);
	border-bottom: 8px solid;
	background: var(--surface);
	box-shadow: var(--shadow);
	color: inherit;
	text-decoration: none;
	transition: transform .1s;
}

.menu-btn:active {
	transform: translateY(3px);
	box-shadow: 0 1px 0 rgba(42, 37, 80, .15);
}

.menu-icon {
	font-size: 64px;
	line-height: 1;
}

.menu-label {
	font-size: 26px;
	font-weight: 700;
}

@media (max-width: 600px) {
	.menu {
		grid-template-columns: 1fr;
	}

	.menu-btn {
		min-height: 120px;
	}
}
</style>
