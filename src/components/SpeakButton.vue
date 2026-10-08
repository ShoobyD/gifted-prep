<script setup lang="ts">
import { computed, onUnmounted } from 'vue';
import { useSpeech } from '@/composables/useSpeech';

const props = defineProps<{ text: string }>();

const { enabled, speakingId, speak, stop } = useSpeech();

// Unique per button instance, so only the one that is speaking shows "stop".
const id = `speak-${Math.random().toString(36).slice(2)}`;
const speaking = computed(() => speakingId.value === id);

function toggle() {
	if (speaking.value) stop();
	else speak(props.text, id);
}

// Leaving the question stops the voice.
onUnmounted(() => {
	if (speaking.value) stop();
});
</script>

<template>
	<button
		v-if="enabled"
		type="button"
		class="speak"
		:class="{ speaking }"
		:aria-label="speaking ? 'עצירת ההקראה' : 'הקראה'"
		@click="toggle"
	>
		{{ speaking ? '⏹️' : '🔊' }}
	</button>
</template>

<style scoped>
.speak {
	flex: none;
	width: 56px;
	height: 56px;
	border: 0;
	border-radius: 50%;
	background: #ece8ff;
	font-size: 28px;
	line-height: 1;
	box-shadow: var(--shadow);
}

.speaking {
	background: var(--primary);
	animation: pop 1s infinite;
}
</style>
