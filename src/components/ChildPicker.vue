<script setup lang="ts">
import { useChildren } from '@/composables/useChildren';

// Which child the parent screens show. Only when the family has more than one.
const { children, activeChild, select } = useChildren();
</script>

<template>
	<nav v-if="children.length > 1" class="picker" aria-label="בחירת ילד">
		<button
			v-for="child in children"
			:key="child.id"
			type="button"
			:class="{ on: child.id === activeChild?.id }"
			:aria-pressed="child.id === activeChild?.id"
			@click="select(child.id)"
		>
			<span v-if="child.icon" aria-hidden="true">{{ child.icon }}</span>
			{{ child.name }}
		</button>
	</nav>
</template>

<style scoped>
.picker {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.picker button {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 44px;
	padding: 0 16px;
	border: 2px solid #e2ddff;
	border-radius: 999px;
	background: var(--surface);
	font: inherit;
	font-weight: 700;
}

.picker button.on {
	border-color: var(--primary);
	background: var(--primary);
	color: #fff;
}
</style>
