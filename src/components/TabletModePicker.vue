<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue';
import { useChildren } from '@/composables/useChildren';
import type { TabletMode } from '@/composables/useTablet';

// Whose tablet this is: one child's, or shared by all of them. For a grown-up (no nikud).
defineProps<{ mode?: TabletMode; childId?: string }>();
const emit = defineEmits<{ pick: [mode: TabletMode, childId?: string] }>();
const { children } = useChildren();
</script>

<template>
	<div class="modes" role="radiogroup" aria-label="של מי הטאבלט">
		<button
			v-for="child in children"
			:key="child.id"
			type="button"
			role="radio"
			class="mode"
			:class="{ on: mode === 'fixed' && childId === child.id }"
			:aria-checked="mode === 'fixed' && childId === child.id"
			@click="emit('pick', 'fixed', child.id)"
		>
			<span class="icon" aria-hidden="true">{{ child.icon || '🙂' }}</span>
			<span>הטאבלט של {{ child.name }}</span>
		</button>
		<button
			type="button"
			role="radio"
			class="mode"
			:class="{ on: mode === 'shared' }"
			:aria-checked="mode === 'shared'"
			@click="emit('pick', 'shared')"
		>
			<AppIcon name="friends" class="icon icon--drawn" />
			<span>משותף: בכל פתיחה בוחרים מי מתרגל</span>
		</button>
	</div>
</template>

<style scoped>
.modes {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 10px;
	width: 100%;
}

.mode {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 56px;
	padding: 8px 14px;
	border: 2px solid var(--line);
	border-radius: 14px;
	background: var(--surface);
	font: inherit;
	font-weight: 700;
	text-align: start;
}

.mode.on {
	border-color: var(--primary);
	background: var(--tint);
}

.icon {
	font-size: 28px;
}

/* A drawn icon beside the children's own pictures, in the album's ink. */
.icon--drawn {
	color: var(--primary);
}
</style>
