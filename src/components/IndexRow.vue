<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import AppIcon from './AppIcon.vue';

// One line of a chapter's printed index: its sticker, its name, a dotted leader to what
// it shows at the end (stars, a score), and the way in. Ruled off, never boxed.
defineProps<{ to: RouteLocationRaw; title: string; meta?: string }>();
</script>

<template>
	<RouterLink class="row" :to="to">
		<slot name="tile" />
		<span class="text">
			<span class="title">{{ title }}</span>
			<span v-if="meta" class="meta">{{ meta }}</span>
		</span>
		<span class="leader" aria-hidden="true" />
		<slot name="end" />
		<span class="go" aria-hidden="true"><AppIcon name="next" /></span>
	</RouterLink>
</template>

<style scoped>
.row {
	display: flex;
	align-items: center;
	gap: 16px;
	min-height: 100px;
	padding: 10px 4px;
	border-bottom: 2px dashed var(--line);
	color: inherit;
	text-decoration: none;
}

.row:active {
	background: var(--tint-soft);
}

.text {
	display: grid;
	gap: 2px;
	min-width: 0;
}

.title {
	font-size: 24px;
	font-weight: 700;
	line-height: 1.3;
}

.meta {
	color: var(--muted);
	font-size: 16px;
}

/* Dots from the name to what the line shows at its end, as in a printed index. */
.leader {
	flex: 1;
	min-width: 16px;
	align-self: center;
	margin-top: 10px;
	border-bottom: 3px dotted var(--line);
}

.go {
	flex: none;
	display: grid;
	place-items: center;
	width: 44px;
	height: 44px;
	border: 3px solid var(--line);
	border-radius: 50%;
	color: var(--primary);
	font-size: 22px;
}

@media (max-width: 699px) {
	.row {
		gap: 12px;
		min-height: 88px;
	}

	.title {
		font-size: 21px;
	}

	.leader {
		display: none;
	}

	.go {
		margin-inline-start: auto;
		width: 36px;
		height: 36px;
		font-size: 18px;
	}
}
</style>
