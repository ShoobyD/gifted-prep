<script setup lang="ts">
import { ref } from 'vue';
import ChildForm from '@/components/ChildForm.vue';
import { useChildren } from '@/composables/useChildren';
import { childrenApi, type Child } from '@/family/childrenApi';
import { CHILD_ICONS } from '@/family/icons';

// The family's children, managed from a parent device: add, rename, pick an icon, remove.
// Each child has its own progress; the icon is how a child finds itself on a shared tablet.
const MAX_CHILDREN = 10;

const { children, accept } = useChildren();
const saving = ref(false);
const error = ref('');

// The child being edited, or 'new' for the add form.
const editing = ref<string>();
const name = ref('');
const icon = ref('');

function start(child?: Child) {
	editing.value = child?.id ?? 'new';
	name.value = child?.name ?? '';
	icon.value = child?.icon ?? CHILD_ICONS[children.value.length % CHILD_ICONS.length] ?? '';
	error.value = '';
}

async function run(task: () => Promise<Child[]>, failure: string): Promise<boolean> {
	saving.value = true;
	error.value = '';
	try {
		accept(await task());
		return true;
	} catch {
		error.value = failure;
		return false;
	} finally {
		saving.value = false;
	}
}

async function save() {
	const child = { name: name.value.trim(), icon: icon.value };
	if (!child.name) {
		error.value = 'צריך שם.';
		return;
	}
	const id = editing.value;
	const saved = id === 'new'
		? await run(() => childrenApi.add(child), 'אין חיבור לשרת, והילד לא נוסף.')
		: await run(() => childrenApi.update(id as string, child), 'אין חיבור לשרת, והשינוי לא נשמר.');
	if (saved) editing.value = undefined;
}

async function remove(child: Child) {
	if (!confirm(`להסיר את ${child.name}? כל ההתקדמות שלו תימחק, ואי אפשר לשחזר אותה.`)) return;
	await run(() => childrenApi.remove(child.id), 'אין חיבור לשרת, והילד לא הוסר.');
}
</script>

<template>
	<section class="card">
		<h2>הילדים</h2>
		<p class="note">לכל ילד התקדמות משלו. בטאבלט משותף, הילד בוחר את עצמו לפי השם והציור.</p>

		<ul class="list">
			<li v-for="child in children" :key="child.id">
				<ChildForm
					v-if="editing === child.id"
					v-model:name="name"
					v-model:icon="icon"
					:saving="saving"
					submit-label="שמירה"
					@save="save"
					@cancel="editing = undefined"
				/>
				<template v-else>
					<span class="who"><span class="icon" aria-hidden="true">{{ child.icon }}</span>{{ child.name }}</span>
					<span class="row-actions">
						<button type="button" class="btn" :disabled="saving" @click="start(child)">עריכה</button>
						<button v-if="children.length > 1" type="button" class="btn btn--danger" :disabled="saving" @click="remove(child)">הסרה</button>
					</span>
				</template>
			</li>
		</ul>

		<ChildForm
			v-if="editing === 'new'"
			v-model:name="name"
			v-model:icon="icon"
			:saving="saving"
			submit-label="הוספה"
			@save="save"
			@cancel="editing = undefined"
		/>
		<div v-else-if="children.length < MAX_CHILDREN" class="actions">
			<button type="button" class="btn" :disabled="saving" @click="start()">+ הוספת ילד</button>
		</div>

		<p v-if="error" class="message tone--warn" role="alert">{{ error }}</p>
	</section>
</template>

<style scoped>
.list {
	display: grid;
	gap: 8px;
	margin: 12px 0;
	padding: 0;
	list-style: none;
}

.list li {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 8px 0;
	border-bottom: 1px solid var(--line-soft);
}

.who {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-weight: 700;
}

.icon {
	font-size: 26px;
}

.row-actions {
	display: flex;
	gap: 8px;
}
</style>
