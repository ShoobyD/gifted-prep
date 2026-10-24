<script setup lang="ts">
import AppIcon from './AppIcon.vue';

// A list item's picture: its icon on a small sticker in the area's color. With a number,
// it is an index sticker: upright, the number printed at its foot.
defineProps<{
	icon: InstanceType<typeof AppIcon>['$props']['name'];
	color: string;
	// The icon's color on it; white unless the color is light.
	ink?: string;
	num?: number;
}>();
</script>

<template>
	<span
		class="tile"
		:class="{ numbered: num !== undefined }"
		:style="{ '--tile': color, '--tile-ink': ink ?? 'var(--on-primary)' }"
		aria-hidden="true"
	>
		<AppIcon :name="icon" />
		<span v-if="num !== undefined" class="num">{{ num }}</span>
	</span>
</template>

<style scoped>
.tile {
	flex: none;
	position: relative;
	display: grid;
	place-items: center;
	width: 64px;
	height: 64px;
	border: 4px solid var(--surface);
	border-radius: 16px;
	background: var(--tile);
	color: var(--tile-ink);
	font-size: 34px;
	box-shadow: 0 3px 6px rgba(16, 34, 79, .25);
	transform: rotate(-3deg);
}

.numbered {
	width: 58px;
	height: 76px;
	border-radius: 12px;
	align-content: start;
	padding-top: 10px;
	font-size: 30px;
}

.num {
	position: absolute;
	inset-inline-start: 5px;
	bottom: 2px;
	font-family: var(--font-display);
	font-size: 20px;
	font-weight: 700;
	line-height: 1;
}
</style>
