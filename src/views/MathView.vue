<script setup lang="ts">
import { useContent } from '@/composables/useContent';
import { useLevels } from '@/composables/useLevels';
import { mathSetName } from '@/data/questionSets';
import type { MathQuestionType } from '@/types';

interface Topic {
	type: MathQuestionType;
	icon: string;
	label: string;
}

const TOPICS: Topic[] = [
	{ type: 'exercise', icon: '➕', label: 'תַּרְגִּילִים' },
	{ type: 'missing-number', icon: '❓', label: 'הַמִּסְפָּר הֶחָסֵר' },
	{ type: 'inequality', icon: '⚖️', label: 'גָּדוֹל אוֹ קָטָן' },
	{ type: 'word-problem', icon: '🛒', label: 'בְּעָיוֹת מִלּוּלִיּוֹת' },
	{ type: 'picture-riddle', icon: '🍎', label: 'חִידוֹת צִיּוּרִים' },
	{ type: 'symbol-digit', icon: '△', label: 'סְפָרוֹת סוֹדִיּוֹת' },
];

const { levels } = useLevels();
const { mathPool } = useContent();
</script>

<template>
	<RouterLink class="mix" :to="{ name: 'practice', params: { set: mathSetName('mix') } }">
		<span class="mix-icon" aria-hidden="true">🎲</span>
		<span>עִרְבּוּב – קְצָת מִכָּל דָּבָר</span>
	</RouterLink>
	<RouterLink v-if="mathPool.length" class="mix mix--real" :to="{ name: 'practice', params: { set: mathSetName('real') } }">
		<span class="mix-icon" aria-hidden="true">🏅</span>
		<span>שְׁאֵלוֹת מִמִּבְחָנִים אֲמִתִּיִּים</span>
	</RouterLink>

	<nav class="topics">
		<RouterLink
			v-for="topic in TOPICS"
			:key="topic.type"
			class="topic"
			:to="{ name: 'practice', params: { set: mathSetName(topic.type) } }"
		>
			<span class="topic-icon" aria-hidden="true">{{ topic.icon }}</span>
			<span class="topic-label">{{ topic.label }}</span>
			<span class="topic-level" :aria-label="`רמה ${levels[topic.type]}`">
				<span v-for="n in 3" :key="n" :class="{ off: n > levels[topic.type] }">⭐</span>
			</span>
		</RouterLink>
	</nav>
</template>

<style scoped>
.mix {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16px;
	min-height: 96px;
	margin-bottom: 20px;
	border-radius: var(--radius);
	background: var(--math);
	color: #fff;
	font-size: 28px;
	font-weight: 700;
	text-decoration: none;
	box-shadow: var(--shadow);
}

.mix--real {
	background: var(--test);
}

.mix-icon {
	font-size: 48px;
}

.topics {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16px;
}

.topic {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	min-height: 160px;
	padding: 16px 8px;
	border-radius: var(--radius);
	border-bottom: 6px solid var(--math);
	background: var(--surface);
	color: inherit;
	text-align: center;
	text-decoration: none;
	box-shadow: var(--shadow);
}

.mix:active,
.topic:active {
	transform: translateY(3px);
}

.topic-icon {
	font-size: 48px;
	line-height: 1;
}

.topic-label {
	font-size: 22px;
	font-weight: 700;
	line-height: 1.3;
}

.topic-level {
	font-size: 16px;
}

.off {
	filter: grayscale(1);
	opacity: .3;
}

@media (max-width: 600px) {
	.topics {
		grid-template-columns: repeat(2, 1fr);
	}
}
</style>
