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
	{ to: { name: 'parents' }, icon: '👪', label: 'הוֹרִים', color: 'var(--parents)' },
];
</script>

<template>
	<RouterLink class="status" :to="{ name: 'stickers' }">
		<span class="stat">⭐ {{ state.stars }}</span>
		<span v-if="streak" class="stat">🔥 {{ streak }} {{ streak === 1 ? 'יוֹם' : 'יָמִים' }}</span>
		<span class="stat">🎖️ {{ state.stickers.length }} מַדְבֵּקוֹת</span>
	</RouterLink>
	<p class="greeting">שָׁלוֹם! בְּמָה נִתְאַמֵּן הַיּוֹם?</p>
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

.menu {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
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

@media (max-width: 480px) {
	.menu {
		grid-template-columns: 1fr;
	}

	.menu-btn {
		min-height: 120px;
	}
}
</style>
