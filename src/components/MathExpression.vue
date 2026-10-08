<script setup lang="ts">
import { computed } from 'vue';
import { BLANK } from '@/types';

const props = defineProps<{
	expression: string;
	// Value shown inside the blank box (what the child typed, or the revealed solution).
	fill?: string;
	state?: 'correct' | 'wrong' | 'revealed';
}>();

const parts = computed(() => props.expression.split(BLANK));
</script>

<template>
	<bdi class="math" dir="ltr">
		<template v-for="(part, i) in parts" :key="i">
			<span>{{ part }}</span>
			<span
				v-if="i < parts.length - 1"
				class="blank"
				:class="state && `blank--${state}`"
			>{{ fill }}</span>
		</template>
	</bdi>
</template>

<style scoped>
.math {
	display: inline-block;
	font-size: clamp(28px, 7vw, 44px);
	font-weight: 700;
	white-space: pre;
	letter-spacing: 1px;
}

.blank {
	display: inline-block;
	min-width: 1.8em;
	height: 1.3em;
	padding: 0 .15em;
	border: 4px dashed var(--primary);
	border-radius: 12px;
	vertical-align: middle;
	line-height: 1.15;
	text-align: center;
	color: var(--primary);
}

.blank--correct {
	border-style: solid;
	border-color: var(--good);
	color: var(--good);
}

.blank--wrong {
	border-color: var(--bad);
}

.blank--revealed {
	border-style: solid;
	border-color: var(--good);
	color: var(--good);
}
</style>
