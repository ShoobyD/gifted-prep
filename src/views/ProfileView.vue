<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import ProfileCard from '@/components/ProfileCard.vue';
import StickerGrid from '@/components/StickerGrid.vue';
import { useChildren } from '@/composables/useChildren';
import { useProfiles } from '@/composables/useProfiles';
import { childrenApi } from '@/family/childrenApi';
import { CHILD_ICONS } from '@/family/icons';
import { earnedStickers, STICKERS } from '@/progress/stickers';

// One child's profile: their achievements and their sticker collection. On their own
// profile, a child can also pick a new picture.
const props = defineProps<{ id: string }>();
const { data, status, refresh } = useProfiles();
const children = useChildren();

const profile = computed(() => data.value?.profiles.find((p) => p.id === props.id));
const stickers = computed(() => earnedStickers(profile.value?.stickers ?? []).length);
const isMe = computed(() => !!profile.value && profile.value.id === children.activeChild.value?.id);

// Opened from the friends screen the list is fresh; opened directly, fetch it.
onMounted(() => {
	if (!profile.value) void refresh();
});

// --- Picking a new picture ---

const picking = ref(false);
const saving = ref(false);
const failed = ref(false);

async function pick(icon: string) {
	if (!profile.value || icon === profile.value.icon) {
		picking.value = false;
		return;
	}
	saving.value = true;
	failed.value = false;
	try {
		children.accept(await childrenApi.update(profile.value.id, { icon }));
		picking.value = false;
		// The new picture everywhere: this card, the friends screen, the other children's tablets.
		await refresh();
	} catch {
		failed.value = true;
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<template v-if="profile && data">
		<ProfileCard class="card" :profile="profile" :today="data.today" :me="isMe" />

		<template v-if="isMe">
			<button v-if="!picking" type="button" class="change" @click="picking = true">
				<AppIcon name="pencil" />
				לְהַחְלִיף צִיּוּר
			</button>
			<section v-else class="picker" aria-label="בְּחִירַת צִיּוּר">
				<p class="picker-title">אֵיזֶה צִיּוּר תִּבְחֲרוּ?</p>
				<div class="icons">
					<button
						v-for="icon in CHILD_ICONS"
						:key="icon"
						type="button"
						class="icon"
						:class="{ on: icon === profile.icon }"
						:aria-pressed="icon === profile.icon"
						:disabled="saving"
						@click="pick(icon)"
					>{{ icon }}</button>
				</div>
				<p v-if="failed" class="note">אֵין חִבּוּר לָאִינְטֶרְנֶט. נְנַסֶּה שׁוּב אַחַר כָּךְ.</p>
				<button type="button" class="change" :disabled="saving" @click="picking = false">בִּיטּוּל</button>
			</section>
		</template>

		<h2 class="count">
			<span>הָאַלְבּוֹם</span>
			<small>{{ stickers }} מִתּוֹךְ {{ STICKERS.length }}</small>
		</h2>
		<StickerGrid :earned="profile.stickers" />
	</template>
	<p v-else-if="status === 'loading'" class="note">טוֹעֲנִים…</p>
	<p v-else class="note">לֹא מָצָאנוּ אֶת הַפְּרוֹפִיל הַזֶּה.</p>
</template>

<style scoped>
.card {
	max-width: 360px;
	margin: 0 auto;
}

.count {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	margin: 36px 0 16px;
	font-size: 46px;
	line-height: 1;
}

.count small {
	color: var(--muted);
	font-family: var(--font);
	font-size: 22px;
	font-weight: 400;
}

.note {
	text-align: center;
	color: var(--muted);
}

.change {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 56px;
	margin: 16px auto 0;
	padding: 0 24px;
	border: 2px solid var(--line);
	border-radius: 999px;
	background: var(--surface);
	font: inherit;
	font-size: 20px;
	font-weight: 700;
}

.picker {
	margin-top: 16px;
	padding: 16px;
	border: 2px solid var(--line-soft);
	border-radius: var(--radius);
	background: var(--tint-soft);
	text-align: center;
}

.picker-title {
	margin: 0 0 12px;
	font-size: 22px;
	font-weight: 700;
}

.icons {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
	gap: 10px;
}

.icon {
	min-height: 72px;
	border: 3px solid transparent;
	border-radius: 18px;
	background: var(--surface);
	font-size: 40px;
}

.icon.on {
	border-color: var(--primary);
	background: var(--surface);
}

.icon:active {
	transform: translateY(3px);
}
</style>
