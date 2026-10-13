// The question bank as the server sends it (GET /api/bank), turned into what the app uses.
import type { BankItemKind, BankTest, MockTest, Passage, Question, TestSection } from '@/types';
import { seedItems } from './seed';
import { isRecord, looksLikePassage, looksLikeQuestion, looksLikeTest } from './shapes';

// One row of the bank, as the server sends it.
export interface BankRecord {
	id: string;
	kind: BankItemKind;
	data: unknown;
	hidden: boolean;
	version: number;
	updatedAt: number;
}

// A full copy of the bank at one revision.
export interface BankSnapshot {
	revision: number;
	items: BankRecord[];
}

export interface BankContent {
	// In the bank's order.
	passages: Passage[];
	mathQuestions: Question[];
	tests: BankTest[];
	// Ids of hidden items (any kind).
	hidden: string[];
}

const CHECKS: Record<BankItemKind, (data: unknown) => boolean> = {
	passage: looksLikePassage,
	question: looksLikeQuestion,
	test: looksLikeTest,
};

// Items of an unknown kind or a broken shape are left out; the rest of the bank still works.
export function toBankContent(records: BankRecord[]): BankContent {
	const content: BankContent = { passages: [], mathQuestions: [], tests: [], hidden: [] };
	for (const record of records) {
		const check = CHECKS[record.kind] as ((data: unknown) => boolean) | undefined;
		if (!check?.(record.data) || (record.data as { id: string }).id !== record.id) continue;
		if (record.kind === 'passage') content.passages.push(record.data as Passage);
		else if (record.kind === 'question') content.mathQuestions.push(record.data as Question);
		else content.tests.push(record.data as BankTest);
		if (record.hidden) content.hidden.push(record.id);
	}
	return content;
}

// Accepts a snapshot from the server or the local cache only if it has the expected shape.
export function parseSnapshot(value: unknown): BankSnapshot | undefined {
	if (!isRecord(value) || !Number.isInteger(value.revision) || !Array.isArray(value.items)) return undefined;
	const items = value.items.filter((item): item is BankRecord =>
		isRecord(item) && typeof item.id === 'string' && typeof item.kind === 'string'
		&& typeof item.hidden === 'boolean' && Number.isInteger(item.version));
	return { revision: value.revision as number, items };
}

// The content shipped with the app: used until the bank has been loaded once.
export function builtInBank(): BankContent {
	return toBankContent(seedItems().map((item) => ({ ...item, hidden: false, version: 0, updatedAt: 0 })));
}

// A test with its sections filled in from the bank. Hidden items stay in: a test keeps the
// structure of the booklet it reproduces. Items deleted from the bank are left out, and so
// is a section left with no questions.
export function buildTest(test: BankTest, passages: Passage[], questions: Question[]): MockTest {
	const passageById = new Map(passages.map((p) => [p.id, p]));
	const questionById = new Map(questions.map((q) => [q.id, q]));
	const sections = test.sections.flatMap((section): TestSection[] => {
		const instructions = section.instructions ? { instructions: section.instructions } : {};
		if (section.passageId) {
			const passage = passageById.get(section.passageId);
			if (!passage?.questions.length) return [];
			return [{ title: section.title ?? passage.title, ...instructions, passage, questions: passage.questions }];
		}
		const found = (section.questionIds ?? []).flatMap((id) => questionById.get(id) ?? []);
		return found.length ? [{ title: section.title ?? '', ...instructions, questions: found }] : [];
	});
	return { id: test.id, title: test.title, source: test.source, sections };
}
