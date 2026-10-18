<script setup lang="ts">
import { CHILD_ICONS } from '@/family/icons';

// A child's name and icon, for adding a child or editing one.
defineProps<{ saving: boolean; submitLabel: string }>();
const emit = defineEmits<{ save: []; cancel: [] }>();
const name = defineModel<string>('name', { required: true });
const icon = defineModel<string>('icon', { required: true });
</script>

<template>
	<form class="form" @submit.prevent="emit('save')">
		<input v-model="name" maxlength="40" aria-label="שם" placeholder="שם">
		<div class="icons" role="radiogroup" aria-label="ציור">
			<button
				v-for="option in CHILD_ICONS"
				:key="option"
				type="button"
				role="radio"
				:aria-checked="icon === option"
				:class="{ on: icon === option }"
				@click="icon = option"
			>{{ option }}</button>
		</div>
		<div class="actions">
			<button type="submit" class="btn btn--primary" :disabled="saving">{{ saving ? 'שומר…' : submitLabel }}</button>
			<button type="button" class="btn" :disabled="saving" @click="emit('cancel')">ביטול</button>
		</div>
	</form>
</template>

<style scoped>
.form {
	display: grid;
	gap: 10px;
	width: 100%;
}

.form input {
	min-height: 44px;
	padding: 0 12px;
	border: 2px solid #e2ddff;
	border-radius: 12px;
	font: inherit;
	font-size: 16px;
}

.icons {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.icons button {
	width: 44px;
	height: 44px;
	border: 2px solid transparent;
	border-radius: 12px;
	background: #f4f1ff;
	font-size: 24px;
}

.icons button.on {
	border-color: var(--primary);
	background: var(--surface);
}

.btn--primary {
	background: var(--primary);
	border-color: var(--primary);
	color: #fff;
	font-weight: 700;
}
</style>
