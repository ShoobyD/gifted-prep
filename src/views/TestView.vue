<script setup lang="ts">
import { computed } from 'vue';
import AreaTile from '@/components/AreaTile.vue';
import ChapterHead from '@/components/ChapterHead.vue';
import IndexRow from '@/components/IndexRow.vue';
import { useProgress } from '@/composables/useProgress';
import { mockTests } from '@/data/mockTests';

const tests = computed(mockTests);
const { state } = useProgress();

// A finished mock test is recorded as a session of set "test-<id>".
const finished = computed(() => new Set(state.sessions.filter((s) => s.set.startsWith('test-')).map((s) => s.set.slice(5))));
const done = computed(() => tests.value.filter((t) => finished.value.has(t.id)).length);
</script>

<template>
	<ChapterHead title="פֶּרֶק מִבְחָנִים" color="var(--test)" :done="done" :total="tests.length" unit="מִבְחָנִים שֶׁנַּעֲשׂוּ" />
	<p class="intro">מִבְחָן שָׁלֵם, כְּמוֹ בְּבֵית הַסֵּפֶר: קֹדֶם קְרִיאָה וְאַחַר כָּךְ חֶשְׁבּוֹן. אֶת הַתְּשׁוּבוֹת רוֹאִים רַק בַּסּוֹף.</p>
	<nav class="index">
		<IndexRow
			v-for="(test, i) in tests"
			:key="test.id"
			:to="{ name: 'test-run', params: { id: test.id } }"
			:title="test.title"
			:meta="test.description"
		>
			<template #tile>
				<AreaTile
					:icon="test.id === 'generated' ? 'sparkle' : 'paper'"
					:color="test.id === 'generated' ? 'var(--gold)' : 'var(--test)'"
					:ink="test.id === 'generated' ? 'var(--text)' : undefined"
					:num="i + 1"
				/>
			</template>
		</IndexRow>
	</nav>
</template>

<style scoped>
.intro {
	max-width: 36em;
	margin: 0 0 12px;
	color: var(--muted);
}
</style>
