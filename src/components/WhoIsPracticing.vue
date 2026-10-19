<script setup lang="ts">
import { useChildren } from '@/composables/useChildren';

// The shared tablet's first screen: each child finds itself by its picture and name.
const { children } = useChildren();
const emit = defineEmits<{ choose: [childId: string] }>();
</script>

<template>
	<section class="who">
		<h2 class="title">מִי מְתַרְגֵּל עַכְשָׁו?</h2>
		<div class="children">
			<button v-for="child in children" :key="child.id" type="button" class="child" @click="emit('choose', child.id)">
				<span class="icon" aria-hidden="true">{{ child.icon || '🙂' }}</span>
				<span class="name">{{ child.name }}</span>
			</button>
		</div>
	</section>
</template>

<style scoped>
.who {
	display: grid;
	justify-items: center;
	gap: 20px;
	margin-top: 24px;
	text-align: center;
}

.title {
	margin: 0;
	font-size: 30px;
}

.children {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 16px;
	width: 100%;
	max-width: 720px;
}

.child {
	display: grid;
	justify-items: center;
	gap: 8px;
	padding: 24px 12px;
	border: 0;
	border-radius: var(--radius);
	border-bottom: 6px solid var(--primary);
	background: var(--surface);
	box-shadow: var(--shadow);
}

.child:active {
	transform: translateY(3px);
}

.icon {
	font-size: 64px;
	line-height: 1;
}

.name {
	font-size: 26px;
	font-weight: 700;
}
</style>
