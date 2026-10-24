<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import AreaTile from '@/components/AreaTile.vue';
import ChapterHead from '@/components/ChapterHead.vue';
import IndexHeading from '@/components/IndexHeading.vue';
import IndexRow from '@/components/IndexRow.vue';
import { useContent } from '@/composables/useContent';
import { useProgress } from '@/composables/useProgress';
import { isTestMaterial, SOURCE_LABELS } from '@/data/sources';
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

// The chapter's count: passages read at least once.
const read = computed(() => passages.value.filter((p) => p.id in state.passages).length);

// Each passage's number in the chapter, running on across the groups.
const numbers = computed(() => new Map(groups.value.flatMap((g) => g.passages).map((p, i) => [p.id, i + 1])));

function meta(passage: Passage): string {
	const count = `${passage.questions.length} שְׁאֵלוֹת`;
	return isTestMaterial(passage.source) ? `${count} · ${SOURCE_LABELS[passage.source]}` : count;
}
</script>

<template>
	<ChapterHead title="פֶּרֶק קְרִיאָה" color="var(--reading)" :done="read" :total="passages.length" unit="קְטָעִים שֶׁנִּקְרְאוּ" />
	<!-- Only before the bank first loads (it needs the internet once). -->
	<p v-if="!groups.length" class="empty">הַקְּטָעִים עוֹד לֹא הִגִּיעוּ. צָרִיךְ חִבּוּר לָאִינְטֶרְנֶט.</p>
	<section v-for="group in groups" :key="group.title">
		<IndexHeading :title="group.title" :meta="`${group.passages.length} קְטָעִים`" />
		<nav class="index">
			<IndexRow
				v-for="passage in group.passages"
				:key="passage.id"
				:to="{ name: 'practice', params: { set: readingSetName(passage) } }"
				:title="passage.title"
				:meta="meta(passage)"
			>
				<template #tile>
					<AreaTile :icon="passage.kind === 'story' ? 'book' : 'facts'" color="var(--reading)" :num="numbers.get(passage.id)" />
				</template>
				<template #end>
					<!-- Read already: how many it got right. -->
					<span v-if="passage.id in state.passages" class="done">
						<AppIcon name="check" />
						<bdi>{{ state.passages[passage.id] }}/{{ passage.questions.length }}</bdi>
					</span>
				</template>
			</IndexRow>
		</nav>
	</section>
</template>

<style scoped>
.empty {
	margin: 24px 0;
	text-align: center;
	color: var(--muted);
}

/* The first section's heading sits right under the chapter's head. */
section:first-of-type :deep(.heading) {
	margin-top: 0;
}

.done {
	flex: none;
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 2px 10px;
	border-radius: 999px;
	background: var(--good-soft);
	color: var(--good);
	font-size: 18px;
	font-weight: 700;
}
</style>
