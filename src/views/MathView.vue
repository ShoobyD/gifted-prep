<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import AreaTile from '@/components/AreaTile.vue';
import ChapterHead from '@/components/ChapterHead.vue';
import IndexHeading from '@/components/IndexHeading.vue';
import IndexRow from '@/components/IndexRow.vue';
import { useContent } from '@/composables/useContent';
import { useLevels } from '@/composables/useLevels';
import { mathSetName, SESSION_LENGTH } from '@/data/questionSets';
import type { MathQuestionType } from '@/types';

interface Topic {
	type: MathQuestionType;
	icon: InstanceType<typeof AppIcon>['$props']['name'];
	label: string;
}

const TOPICS: Topic[] = [
	{ type: 'exercise', icon: 'exercise', label: 'תַּרְגִּילִים' },
	{ type: 'missing-number', icon: 'missing', label: 'הַמִּסְפָּר הֶחָסֵר' },
	{ type: 'inequality', icon: 'compare', label: 'גָּדוֹל אוֹ קָטָן' },
	{ type: 'word-problem', icon: 'cart', label: 'בְּעָיוֹת מִלּוּלִיּוֹת' },
	{ type: 'picture-riddle', icon: 'apple', label: 'חִידוֹת צִיּוּרִים' },
	{ type: 'symbol-digit', icon: 'shapes', label: 'סְפָרוֹת סוֹדִיּוֹת' },
];
const MAX_LEVEL = 3;

const { levels } = useLevels();
const { mathPool } = useContent();
// The chapter's count: level stars earned across the topics.
const levelStars = computed(() => TOPICS.reduce((sum, topic) => sum + levels[topic.type], 0));
</script>

<template>
	<ChapterHead
		title="פֶּרֶק חֶשְׁבּוֹן"
		color="var(--math)"
		ink="var(--on-math)"
		:done="levelStars"
		:total="TOPICS.length * MAX_LEVEL"
		unit="כּוֹכְבֵי רָמָה"
	/>

	<!-- Little sticker packs, like the one on the album's first page. -->
	<div class="packs">
		<RouterLink class="pack" :to="{ name: 'practice', params: { set: mathSetName('mix') } }">
			<span class="wrapper"><AppIcon name="dice" /></span>
			<span class="pack-text">
				<strong>עִרְבּוּב</strong>
				<span>{{ SESSION_LENGTH }} שְׁאֵלוֹת, קְצָת מִכָּל דָּבָר</span>
			</span>
		</RouterLink>
		<RouterLink v-if="mathPool.length" class="pack pack--real" :to="{ name: 'practice', params: { set: mathSetName('real') } }">
			<span class="wrapper"><AppIcon name="medal" /></span>
			<span class="pack-text">
				<strong>מִמִּבְחָנִים אֲמִתִּיִּים</strong>
				<span>שְׁאֵלוֹת שֶׁהָיוּ בְּמִבְחָנִים</span>
			</span>
		</RouterLink>
	</div>

	<IndexHeading title="נוֹשְׂאִים" :meta="`${TOPICS.length} נוֹשְׂאִים · ${MAX_LEVEL} רָמוֹת בְּכָל אֶחָד`" />
	<nav class="index">
		<IndexRow
			v-for="(topic, i) in TOPICS"
			:key="topic.type"
			:to="{ name: 'practice', params: { set: mathSetName(topic.type) } }"
			:title="topic.label"
		>
			<template #tile>
				<AreaTile :icon="topic.icon" color="var(--math)" ink="var(--on-math)" :num="i + 1" />
			</template>
			<template #end>
				<span class="level" :aria-label="`רמה ${levels[topic.type]}`">
					<AppIcon v-for="n in MAX_LEVEL" :key="n" name="star" :class="{ on: n <= levels[topic.type] }" />
				</span>
			</template>
		</IndexRow>
	</nav>
</template>

<style scoped>
.packs {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
	gap: 16px;
}

.pack {
	--pack-color: var(--pack);
	display: flex;
	align-items: center;
	gap: 18px;
	min-height: 120px;
	padding: 14px 22px;
	border-radius: 22px;
	background: var(--pack-color);
	color: var(--on-primary);
	text-decoration: none;
	box-shadow: 0 8px 16px rgba(16, 34, 79, .22);
	transition: transform .15s ease-out;
}

.pack--real {
	--pack-color: var(--test);
}

.pack:active {
	transform: translateY(2px);
}

/* The pack's white wrapper, its top torn in teeth like the pack on the first page. */
.wrapper {
	flex: none;
	display: grid;
	place-items: center;
	width: 60px;
	height: 78px;
	padding-top: 10px;
	background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 78'%3E%3Cpath d='M0 6l5-6 5 6 5-6 5 6 5-6 5 6 5-6 5 6 5-6 5 6 5-6 5 6v72H0z' fill='%23fff'/%3E%3C/svg%3E") center / 100% 100% no-repeat;
	color: var(--pack-color);
	font-size: 34px;
	filter: drop-shadow(0 3px 4px rgba(60, 0, 20, .3));
	transform: rotate(-5deg);
}

.pack-text {
	display: grid;
	gap: 2px;
	font-size: 18px;
	line-height: 1.3;
}

.pack-text strong {
	font-family: var(--font-display);
	font-size: 42px;
	line-height: 1;
}

.level {
	flex: none;
	display: flex;
	gap: 2px;
	font-size: 24px;
	color: var(--line);
}

.level .on {
	color: var(--math);
}

.level :deep(path) {
	fill: currentColor;
	stroke: none;
}
</style>
