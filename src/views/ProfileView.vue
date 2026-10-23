<script setup lang="ts">
import { computed, onMounted } from 'vue';
import ProfileCard from '@/components/ProfileCard.vue';
import StickerGrid from '@/components/StickerGrid.vue';
import { useChildren } from '@/composables/useChildren';
import { useProfiles } from '@/composables/useProfiles';
import { earnedStickers, STICKERS } from '@/progress/stickers';

// One child's profile: their achievements and their sticker collection.
const props = defineProps<{ id: string }>();
const { data, status, refresh } = useProfiles();
const { activeChild } = useChildren();

const profile = computed(() => data.value?.profiles.find((p) => p.id === props.id));
const stickers = computed(() => earnedStickers(profile.value?.stickers ?? []).length);

// Opened from the friends screen the list is fresh; opened directly, fetch it.
onMounted(() => {
	if (!profile.value) void refresh();
});
</script>

<template>
	<template v-if="profile && data">
		<ProfileCard :profile="profile" :today="data.today" :me="profile.id === activeChild?.id" />
		<p class="count">{{ stickers }} מִתּוֹךְ {{ STICKERS.length }} מַדְבֵּקוֹת</p>
		<StickerGrid :earned="profile.stickers" />
	</template>
	<p v-else-if="status === 'loading'" class="note">טוֹעֲנִים…</p>
	<p v-else class="note">לֹא מָצָאנוּ אֶת הַפְּרוֹפִיל הַזֶּה.</p>
</template>

<style scoped>
.count {
	margin: 24px 0 16px;
	text-align: center;
	font-size: 24px;
}

.note {
	text-align: center;
	color: var(--muted);
}
</style>
