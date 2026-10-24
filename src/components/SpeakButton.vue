<script setup lang="ts">
import { computed, onUnmounted } from 'vue';
import AppIcon from './AppIcon.vue';
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
		<AppIcon :name="speaking ? 'stop' : 'speaker'" />
	</button>
</template>

<style scoped>
.speak {
	flex: none;
	display: grid;
	place-items: center;
	width: 56px;
	height: 56px;
	border: 3px solid var(--line);
	border-radius: 50%;
	background: var(--surface);
	color: var(--primary);
	font-size: 28px;
	box-shadow: var(--shadow-sm);
}

.speak:active {
	transform: translateY(2px);
}

.speaking {
	border-color: var(--primary);
	background: var(--primary);
	color: var(--on-primary);
	animation: pop 1s infinite;
}
</style>
