<script setup lang="ts">
import { computed } from 'vue';
import { useContent } from '@/composables/useContent';
import { useProgress } from '@/composables/useProgress';
import { isTestMaterial, SOURCE_LABELS } from '@/data/content';
import { readingSetName } from '@/data/questionSets';
import type { Passage } from '@/types';

const { state } = useProgress();
const { passages } = useContent();

interface Group {
	title: string;
	passages: Passage[];
}

// Hidden passages are left out; passages the parent added join the practice groups.
const groups = computed<Group[]>(() => {
	const practice = passages.value.filter((p) => !isTestMaterial(p.source));
	return [
		{ title: 'מִתּוֹךְ מִבְחָנִים', passages: passages.value.filter((p) => isTestMaterial(p.source)) },
		{ title: 'סִפּוּרִים', passages: practice.filter((p) => p.kind === 'story') },
		{ title: 'קְטָעִים מֵידָעִיִּים', passages: practice.filter((p) => p.kind === 'informational') },
	].filter((group) => group.passages.length);
});
</script>

<template>
	<section v-for="group in groups" :key="group.title" class="group">
		<h2 class="group-title">{{ group.title }}</h2>
		<nav class="passages">
			<RouterLink
				v-for="passage in group.passages"
				:key="passage.id"
				class="passage"
				:to="{ name: 'practice', params: { set: readingSetName(passage) } }"
			>
				<span class="icon" aria-hidden="true">{{ passage.kind === 'story' ? '📗' : '📘' }}</span>
				<span class="title">{{ passage.title }}</span>
				<span v-if="passage.id in state.passages" class="done">
					✅ {{ state.passages[passage.id] }}/{{ passage.questions.length }}
				</span>
				<span class="meta">
					{{ passage.questions.length }} שְׁאֵלוֹת
					<template v-if="isTestMaterial(passage.source)"> · {{ SOURCE_LABELS[passage.source] }}</template>
				</span>
			</RouterLink>
		</nav>
	</section>
</template>

<style scoped>
.group + .group {
	margin-top: 28px;
}

.group-title {
	margin: 0 0 12px;
	font-size: 24px;
	color: var(--muted);
}

.passages {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 16px;
}

.passage {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	min-height: 150px;
	padding: 16px 12px;
	border-radius: var(--radius);
	border-bottom: 6px solid var(--reading);
	background: var(--surface);
	color: inherit;
	text-align: center;
	text-decoration: none;
	box-shadow: var(--shadow);
}

.passage:active {
	transform: translateY(3px);
}

.icon {
	font-size: 44px;
	line-height: 1;
}

.title {
	font-size: 22px;
	font-weight: 700;
	line-height: 1.3;
}

.done {
	color: var(--good);
	font-size: 18px;
	font-weight: 700;
}

.meta {
	color: var(--muted);
	font-size: 16px;
}
</style>
