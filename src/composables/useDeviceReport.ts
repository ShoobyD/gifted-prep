import { watch } from 'vue';
import { useDevice } from './useDevice';
import { useProgress } from './useProgress';
import { useSpeech } from './useSpeech';

// Voices load asynchronously; if none shows up by then, the tablet has no Hebrew voice.
const VOICE_WAIT_MS = 5000;

let started = false;

// The child's tablet tells the parent (through its synced progress) whether it has a Hebrew
// voice, since read-aloud depends on the tablet, not on the parent's phone.
export function useDeviceReport() {
	if (started) return;
	started = true;
	const device = useDevice();
	const speech = useSpeech();
	const { state } = useProgress();

	function report(hebrewVoice: string | null) {
		if (!device.isChild.value || state.device?.hebrewVoice === hebrewVoice) return;
		state.device = { hebrewVoice, reportedAt: Date.now() };
	}

	// Reports a voice as soon as it's known; with none yet, waits a little before reporting
	// "none" (also when the device is chosen as the child's only later).
	watch([speech.voiceName, device.isChild], ([name, isChild]) => {
		if (name) report(name);
		else if (isChild) setTimeout(() => {
			if (!speech.voiceName.value) report(null);
		}, VOICE_WAIT_MS);
	}, { immediate: true });
}
