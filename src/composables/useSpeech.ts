import { computed, ref } from 'vue';
import { splitSentences } from '@/speech/speechText';
import { useProgress } from './useProgress';

// A bit slower than default, for young listeners.
const RATE = 0.9;

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined;
const hebrewVoice = ref<SpeechSynthesisVoice>();
const speakingId = ref<string>();

// Voices load asynchronously (and on Android can change after install), so re-check on change.
function findVoice() {
	const voices = synth?.getVoices() ?? [];
	// Android reports Hebrew as "iw" on some versions.
	hebrewVoice.value = voices.find((v) => /^(he|iw)\b/i.test(v.lang));
}

if (synth) {
	findVoice();
	synth.addEventListener('voiceschanged', findVoice);
}

export function useSpeech() {
	const { state } = useProgress();

	const hasVoice = computed(() => !!hebrewVoice.value);
	const enabled = computed(() => hasVoice.value && state.settings.speech);

	function stop() {
		synth?.cancel();
		speakingId.value = undefined;
	}

	// `id` identifies the button that started speaking, so only it shows "stop".
	function speak(text: string, id: string) {
		if (!synth || !hebrewVoice.value) return;
		stop();
		const sentences = splitSentences(text);
		speakingId.value = id;
		sentences.forEach((sentence, i) => {
			const utterance = new SpeechSynthesisUtterance(sentence);
			utterance.voice = hebrewVoice.value as SpeechSynthesisVoice;
			utterance.lang = utterance.voice.lang;
			utterance.rate = RATE;
			if (i === sentences.length - 1) {
				utterance.onend = () => {
					if (speakingId.value === id) speakingId.value = undefined;
				};
			}
			synth.speak(utterance);
		});
	}

	return { supported: !!synth, hasVoice, enabled, speakingId, speak, stop, voiceName: computed(() => hebrewVoice.value?.name) };
}
