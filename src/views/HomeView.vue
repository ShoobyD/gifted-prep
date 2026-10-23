<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useChildren } from '@/composables/useChildren';
import { useProgress } from '@/composables/useProgress';
import { useSession } from '@/composables/useSession';
import { useTablet } from '@/composables/useTablet';
import { earnedStickers } from '@/progress/stickers';

const { state, streak } = useProgress();
const stickerCount = computed(() => earnedStickers(state.stickers).length);
const { activeChild } = useChildren();
const session = useSession();
// On a shared tablet: who is practicing, and a way to hand over to another child.
const tablet = useTablet();

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
		<span class="stat">🎖️ {{ stickerCount }} מַדְבֵּקוֹת</span>
	</RouterLink>
	<div class="hello">
		<!-- The child's picture; it opens their profile, where they can pick another one. -->
		<RouterLink
			v-if="activeChild && session.authenticated.value"
			class="avatar"
			:to="{ name: 'friend', params: { id: activeChild.id } }"
			aria-label="הַפְּרוֹפִיל שֶׁלִּי"
		>{{ activeChild.icon || '🙂' }}</RouterLink>
		<p class="greeting">שָׁלוֹם<template v-if="activeChild">, {{ activeChild.name }}</template>! בְּמָה נִתְאַמֵּן הַיּוֹם?</p>
	</div>
	<button v-if="tablet.isShared.value" type="button" class="switch" @click="tablet.ask()">
		<span aria-hidden="true">🔄</span> מִישֶׁהוּ אַחֵר מְתַרְגֵּל?
	</button>
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
	<!-- Only behind the server: the other children's achievements come from it. -->
	<RouterLink v-if="session.authenticated.value" class="friends" :to="{ name: 'friends' }">
		<span aria-hidden="true">👫</span>
		<span>הַחֲבֵרִים</span>
	</RouterLink>
</template>

<style scoped>
.friends {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	min-height: 72px;
	margin-top: 20px;
	border-radius: var(--radius);
	border-bottom: 6px solid var(--parents);
	background: var(--surface);
	color: var(--text);
	font-size: 26px;
	font-weight: 700;
	text-decoration: none;
	box-shadow: var(--shadow);
}

.friends:active {
	transform: translateY(3px);
}

.switch {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: -8px auto 20px;
	min-height: 48px;
	padding: 0 20px;
	border: 2px solid #e2ddff;
	border-radius: 999px;
	background: var(--surface);
	font: inherit;
	font-size: 18px;
}

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

.hello {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 8px 16px;
	margin: 0 0 24px;
}

.avatar {
	display: grid;
	place-items: center;
	width: 72px;
	height: 72px;
	border: 3px solid var(--primary);
	border-radius: 50%;
	background: var(--surface);
	box-shadow: var(--shadow);
	font-size: 42px;
	line-height: 1;
	text-decoration: none;
}

.avatar:active {
	transform: translateY(3px);
}

.greeting {
	margin: 0;
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
