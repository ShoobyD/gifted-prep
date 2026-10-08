<script setup lang="ts">
import { MOCK_TESTS } from '@/data/mockTests';
</script>

<template>
	<p class="intro">מִבְחָן שָׁלֵם, כְּמוֹ בְּבֵית הַסֵּפֶר: קֹדֶם קְרִיאָה וְאַחַר כָּךְ חֶשְׁבּוֹן. אֶת הַתְּשׁוּבוֹת רוֹאִים רַק בַּסּוֹף.</p>
	<nav class="tests">
		<RouterLink
			v-for="test in MOCK_TESTS"
			:key="test.id"
			class="test"
			:class="{ 'test--new': test.id === 'generated' }"
			:to="{ name: 'test-run', params: { id: test.id } }"
		>
			<span class="icon" aria-hidden="true">{{ test.id === 'generated' ? '✨' : '📝' }}</span>
			<span class="title">{{ test.title }}</span>
			<span class="description">{{ test.description }}</span>
		</RouterLink>
	</nav>
</template>

<style scoped>
.intro {
	margin: 0 0 20px;
	text-align: center;
	color: var(--muted);
}

.tests {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	gap: 16px;
}

.test {
	display: grid;
	justify-items: center;
	gap: 6px;
	padding: 20px 16px;
	border-radius: var(--radius);
	border-bottom: 6px solid var(--test);
	background: var(--surface);
	color: inherit;
	text-align: center;
	text-decoration: none;
	box-shadow: var(--shadow);
}

.test--new {
	background: #eaf0ff;
}

.test:active {
	transform: translateY(3px);
}

.icon {
	font-size: 48px;
	line-height: 1;
}

.title {
	font-size: 24px;
	font-weight: 700;
}

.description {
	color: var(--muted);
	font-size: 17px;
	line-height: 1.4;
}
</style>
