<script setup lang="ts">
import { computed, ref } from 'vue';
import ChoiceList from '@/components/ChoiceList.vue';
import NumPad from '@/components/NumPad.vue';
import PassagePanel from '@/components/PassagePanel.vue';
import QuestionStem from '@/components/QuestionStem.vue';
import RichText from '@/components/RichText.vue';
import { isAnswered, isCorrect, PART_MINUTES, useMockTest, type Item, type MockAnswer } from '@/composables/useMockTest';
import { useProgress } from '@/composables/useProgress';
import type { MockTestEntry } from '@/data/mockTests';
import type { Sticker } from '@/progress/stickers';
import type { Question } from '@/types';

const props = defineProps<{ entry: MockTestEntry }>();

const LABELS = ['א', 'ב', 'ג', 'ד', 'ה'];

// Built once per visit, so a generated test stays the same while it's taken.
const test = props.entry.build();
const progress = useProgress();
const { items, index, current, answers, unanswered, secondsLeft, start, goTo, answer } = useMockTest(test);

const phase = ref<'intro' | 'running' | 'results'>('intro');
const timerOn = ref(false);
const startedAt = ref(0);
const earnedStickers = ref<Sticker[]>([]);

const question = computed(() => current.value.question);
const section = computed(() => current.value.section);
const currentAnswer = computed(() => answers.get(question.value.id));
const typed = computed(() => (typeof currentAnswer.value === 'string' ? currentAnswer.value : ''));
const isLast = computed(() => index.value === items.length - 1);

// Questions of the current section, numbered from 1 as in the booklet.
const sectionItems = computed(() =>
	items
		.map((item, i) => ({ item, i }))
		.filter(({ item }) => item.sectionIndex === current.value.sectionIndex),
);

const clock = computed(() => {
	const m = Math.floor(secondsLeft.value / 60);
	const s = secondsLeft.value % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
});

function begin() {
	phase.value = 'running';
	startedAt.value = Date.now();
	start();
}

function finish() {
	if (unanswered.value && !confirm(`נִשְׁאֲרוּ ${unanswered.value} שְׁאֵלוֹת בְּלִי תְּשׁוּבָה. לְסַיֵּם בְּכָל זֹאת?`)) return;
	for (const item of items) {
		const outcome = isCorrect(item.question, answers.get(item.question.id)) ? 'first' : 'failed';
		progress.recordAnswer(item.question.type, outcome);
		progress.recordMistake(item.question, outcome, item.section.passage?.id);
	}
	earnedStickers.value = progress.finishSession({
		at: new Date().toISOString(),
		set: `test-${props.entry.id}`,
		correct: correctCount.value,
		total: items.length,
		stars: correctCount.value * 2,
		seconds: Math.round((Date.now() - startedAt.value) / 1000),
	});
	phase.value = 'results';
	window.scrollTo(0, 0);
}

// --- Results ------------------------------------------------------------------

const correctOf = (list: Item[]) => list.filter((it) => isCorrect(it.question, answers.get(it.question.id))).length;
const correctCount = computed(() => correctOf(items));

const sectionScores = computed(() =>
	test.sections.map((s, i) => {
		const list = items.filter((it) => it.sectionIndex === i);
		return { title: s.title, correct: correctOf(list), total: list.length };
	}),
);

const mistakes = computed(() => items.filter((it) => !isCorrect(it.question, answers.get(it.question.id))));

function answerText(q: Question, value: MockAnswer | undefined): string {
	if (!isAnswered(value)) return 'לֹא נַעֲנְתָה';
	if (q.answer.kind === 'choice' && typeof value === 'number') return `${LABELS[value]}. ${q.answer.options[value]}`;
	return String(value);
}

function correctText(q: Question): string {
	const { answer: a } = q;
	if (a.kind === 'choice') return `${LABELS[a.correctIndex]}. ${a.options[a.correctIndex]}`;
	if (a.rule.op === 'gt') return `כָּל מִסְפָּר גָּדוֹל מִ-${a.rule.value}, לְמָשָׁל ${a.solution}`;
	if (a.rule.op === 'lt') return `כָּל מִסְפָּר קָטָן מִ-${a.rule.value}, לְמָשָׁל ${a.solution}`;
	return String(a.solution);
}
</script>

<template>
	<!-- Intro -->
	<section v-if="phase === 'intro'" class="intro card">
		<h2 class="intro-title">{{ test.title }}</h2>
		<ol class="structure">
			<li v-for="s in test.sections" :key="s.title">{{ s.title }} – {{ s.questions.length }} שְׁאֵלוֹת</li>
		</ol>
		<p class="note">בַּמִּבְחָן לֹא רוֹאִים אִם הַתְּשׁוּבָה נְכוֹנָה. אֶפְשָׁר לַחֲזֹר אֲחוֹרָה וּלְשַׁנּוֹת. בַּסּוֹף רוֹאִים הַכֹּל.</p>
		<label class="toggle">
			<input v-model="timerOn" type="checkbox">
			<span>עִם שָׁעוֹן ({{ PART_MINUTES }} דַּקּוֹת לַקְּרִיאָה וְ-{{ PART_MINUTES }} לַחֶשְׁבּוֹן)</span>
		</label>
		<button type="button" class="btn btn--primary" @click="begin">מַתְחִילִים! ✏️</button>
	</section>

	<!-- Running -->
	<div v-else-if="phase === 'running'" class="run" :class="{ 'run--reading': section.passage }">
		<PassagePanel v-if="section.passage" :passage="section.passage" />

		<div class="question-col">
			<header class="section-head">
				<p class="section-title">{{ section.title }}</p>
				<p v-if="section.instructions" class="instructions">{{ section.instructions }}</p>
				<p v-if="timerOn" class="timer" :class="{ 'timer--over': !secondsLeft }">
					<template v-if="secondsLeft">⏱ <bdi dir="ltr">{{ clock }}</bdi></template>
					<template v-else>⏱ הַזְּמַן שֶׁל הַפֶּרֶק נִגְמַר – אֶפְשָׁר לְהַמְשִׁיךְ</template>
				</p>
			</header>

			<nav class="qnav" aria-label="שְׁאֵלוֹת בַּפֶּרֶק">
				<button
					v-for="({ item, i }, n) in sectionItems"
					:key="item.question.id"
					type="button"
					class="qnav-btn"
					:class="{ answered: isAnswered(answers.get(item.question.id)), current: i === index }"
					@click="goTo(i)"
				>
					{{ n + 1 }}
				</button>
			</nav>

			<article :key="question.id" class="card question">
				<QuestionStem
					:question="question"
					:fill="question.answer.kind === 'number' ? typed : undefined"
					:hide-prompt="question.prompt === section.instructions"
				/>
				<ChoiceList
					v-if="question.answer.kind === 'choice'"
					:options="question.answer.options"
					:wrong="[]"
					:selected="typeof currentAnswer === 'number' ? currentAnswer : undefined"
					:disabled="false"
					@pick="answer"
				/>
				<template v-else>
					<p v-if="!question.math" class="typed">{{ typed || ' ' }}</p>
					<NumPad :model-value="typed" :disabled="false" no-submit @update:model-value="answer" />
				</template>
			</article>

			<div class="nav-buttons">
				<button type="button" class="btn" :disabled="index === 0" @click="goTo(index - 1)">→ הַקּוֹדֶמֶת</button>
				<button v-if="!isLast" type="button" class="btn btn--primary" @click="goTo(index + 1)">הַבָּאָה ←</button>
				<button v-else type="button" class="btn btn--finish" @click="finish">סִיּוּם הַמִּבְחָן ✔</button>
			</div>
		</div>
	</div>

	<!-- Results -->
	<section v-else class="results">
		<div class="card score-card">
			<p class="score">{{ correctCount }} / {{ items.length }}</p>
			<p class="score-label">תְּשׁוּבוֹת נְכוֹנוֹת · +{{ correctCount * 2 }} ⭐</p>
			<div v-if="earnedStickers.length" class="stickers">
				<span v-for="s in earnedStickers" :key="s.id" class="sticker">{{ s.emoji }} {{ s.name }}</span>
			</div>
		</div>

		<div class="card">
			<div v-for="s in sectionScores" :key="s.title" class="section-score">
				<span>{{ s.title }}</span>
				<bdi class="section-score-value">{{ s.correct }}/{{ s.total }}</bdi>
			</div>
		</div>

		<h2 v-if="mistakes.length" class="review-title">בּוֹאוּ נִלְמַד מֵהַטָּעֻיּוֹת</h2>
		<p v-else class="review-title">אֵין אַף טָעוּת! 🏆</p>
		<article v-for="m in mistakes" :key="m.question.id" class="card mistake">
			<p class="mistake-section">{{ m.section.title }}</p>
			<QuestionStem :question="m.question" :fill="m.question.answer.kind === 'number' ? String(m.question.answer.solution) : undefined" state="revealed" />
			<p class="yours">הַתְּשׁוּבָה שֶׁלְּךָ: <RichText :text="answerText(m.question, answers.get(m.question.id))" /></p>
			<p class="right">הַתְּשׁוּבָה הַנְּכוֹנָה: <RichText :text="correctText(m.question)" /></p>
			<p v-if="m.question.explanation" class="explanation"><RichText :text="m.question.explanation" /></p>
		</article>

		<div class="nav-buttons">
			<RouterLink class="btn btn--primary" :to="{ name: 'test' }" replace>לְמִבְחָן אַחֵר</RouterLink>
			<RouterLink class="btn" :to="{ name: 'home' }" replace>לְמָסַךְ הַבַּיִת</RouterLink>
		</div>
	</section>
</template>

<style scoped>
.card {
	padding: 20px;
	border-radius: var(--radius);
	background: var(--surface);
	box-shadow: var(--shadow);
}

/* Intro */
.intro {
	display: grid;
	justify-items: center;
	gap: 16px;
	max-width: 640px;
	margin: 0 auto;
}

.intro-title {
	margin: 0;
}

.structure {
	margin: 0;
	padding-inline-start: 24px;
	justify-self: stretch;
}

.note {
	margin: 0;
	color: var(--muted);
	text-align: center;
}

.toggle {
	display: flex;
	align-items: center;
	gap: 12px;
	cursor: pointer;
}

.toggle input {
	width: 28px;
	height: 28px;
}

/* Running */
.run,
.question-col {
	display: grid;
	gap: 20px;
	align-content: start;
}

@media (min-width: 1000px) {
	.run--reading {
		grid-template-columns: 1fr 1fr;
	}
}

.section-head {
	display: grid;
	gap: 4px;
}

.section-title {
	margin: 0;
	font-size: 26px;
	font-weight: 700;
}

.instructions {
	margin: 0;
	color: var(--muted);
}

.timer {
	margin: 0;
	font-weight: 700;
}

.timer--over {
	color: var(--muted);
	font-weight: 400;
}

.qnav {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.qnav-btn {
	width: 48px;
	height: 48px;
	border: 3px solid #dcd6ff;
	border-radius: 50%;
	background: var(--surface);
	font-weight: 700;
}

.qnav-btn.answered {
	border-color: var(--primary);
	background: #ece8ff;
}

.qnav-btn.current {
	outline: 3px solid var(--primary);
	outline-offset: 2px;
}

.question {
	display: grid;
	gap: 20px;
}

.typed {
	justify-self: center;
	min-width: 140px;
	margin: 0;
	padding: 4px 16px;
	border: 4px dashed var(--primary);
	border-radius: 14px;
	font-size: 40px;
	font-weight: 700;
	text-align: center;
	color: var(--primary);
}

.nav-buttons {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: 12px;
}

.btn {
	min-height: 64px;
	padding: 0 28px;
	border: 0;
	border-radius: 18px;
	background: var(--surface);
	color: var(--text);
	font-size: 22px;
	font-weight: 700;
	line-height: 64px;
	text-decoration: none;
	box-shadow: var(--shadow);
}

.btn:disabled {
	opacity: .4;
}

.btn--primary {
	background: var(--primary);
	color: #fff;
}

.btn--finish {
	background: var(--good);
	color: #fff;
}

/* Results */
.results {
	display: grid;
	gap: 16px;
}

.score-card {
	display: grid;
	justify-items: center;
	gap: 4px;
}

.score {
	margin: 0;
	font-size: 56px;
	font-weight: 700;
	direction: ltr;
}

.score-label {
	margin: 0;
	color: var(--muted);
}

.stickers {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-top: 8px;
	font-size: 22px;
}

.section-score {
	display: flex;
	justify-content: space-between;
	padding: 6px 0;
	border-bottom: 1px solid #eeeaff;
}

.section-score-value {
	font-weight: 700;
}

.review-title {
	margin: 12px 0 0;
	font-size: 26px;
	text-align: center;
}

.mistake {
	display: grid;
	gap: 12px;
}

.mistake-section {
	margin: 0;
	color: var(--muted);
	font-size: 18px;
}

.yours,
.right,
.explanation {
	margin: 0;
}

.yours {
	color: var(--bad);
}

.right {
	color: var(--good);
	font-weight: 700;
}

.explanation {
	color: var(--muted);
}
</style>
