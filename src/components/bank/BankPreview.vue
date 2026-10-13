<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import PassageText from '@/components/PassageText.vue';
import { useBankEditor } from '@/composables/useBankEditor';
import type { Passage, Question } from '@/types';
import QuestionPreview from './QuestionPreview.vue';

// A full-screen look at one item: a passage with all its questions, or a math question.
const props = defineProps<{ passage?: Passage; question?: Question }>();
const emit = defineEmits<{ close: [] }>();

const editor = useBankEditor();

// A question inside a passage is hidden by saving the passage with the question marked.
function toggle(questionId: string) {
	if (!props.passage) return;
	void editor.change<Passage>('passage', props.passage.id, (passage) => ({
		...passage,
		questions: passage.questions.map((q) => {
			if (q.id !== questionId) return q;
			const { hidden, ...rest } = q;
			return hidden ? rest : { ...rest, hidden: true };
		}),
	}));
}

function onKey(event: KeyboardEvent) {
	if (event.key === 'Escape') emit('close');
}
onMounted(() => document.addEventListener('keydown', onKey));
onUnmounted(() => document.removeEventListener('keydown', onKey));
</script>

<template>
	<div class="overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
		<div class="sheet parents">
			<header class="sheet-head">
				<h2>{{ passage ? passage.title : 'שאלה' }}</h2>
				<button type="button" class="btn" @click="emit('close')">סגירה ✕</button>
			</header>
			<p v-if="editor.error.value" class="message tone--warn" role="alert">{{ editor.error.value }}</p>

			<template v-if="passage">
				<PassageText :passage="passage" />
				<section v-for="(q, i) in passage.questions" :key="q.id" class="card item" :class="{ hidden: q.hidden }">
					<div class="item-head">
						<strong>שאלה {{ i + 1 }}</strong>
						<span v-if="q.hidden" class="badge">מוסתרת</span>
						<button type="button" class="btn small" :disabled="editor.saving.value" @click="toggle(q.id)">
							{{ q.hidden ? 'הצגה' : 'הסתרה' }}
						</button>
					</div>
					<QuestionPreview :question="{ ...q, source: q.source ?? passage.source }" />
				</section>
			</template>

			<section v-else-if="question" class="card">
				<QuestionPreview :question="question" />
			</section>
		</div>
	</div>
</template>

<style scoped>
.overlay {
	position: fixed;
	inset: 0;
	z-index: 20;
	overflow-y: auto;
	padding: 16px;
	background: rgba(42, 37, 80, .45);
}

.sheet {
	max-width: 760px;
	margin: 0 auto;
	padding: 16px;
	border-radius: var(--radius);
	background: var(--bg);
}

.sheet-head {
	position: sticky;
	top: -16px;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin: -16px -16px 0;
	padding: 12px 16px;
	border-radius: var(--radius) var(--radius) 0 0;
	background: var(--bg);
}

.sheet-head h2 {
	margin: 0;
}

.item-head {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 8px;
}

.item-head .btn {
	margin-inline-start: auto;
}

.item.hidden {
	opacity: .55;
}

.badge {
	padding: 2px 10px;
	border-radius: 999px;
	background: #eeeaff;
	font-size: 13px;
}

.btn.small {
	min-height: 40px;
	padding: 0 14px;
}
</style>
