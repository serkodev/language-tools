import type { TextDocument } from '@volar/language-server';
import { afterEach, expect, test } from 'vitest';
import { URI } from 'vscode-uri';
import { getLanguageServer, testWorkspacePath } from './server';

test('auto-import is not offered for an already-imported component', async () => {
	const completions = await requestCompletionList(`
		<script setup lang="ts">
		import CamelComp from './CamelComp.vue';
		</script>

		<template>
			<camel|
		</template>
	`);
	const labels = completions.items.map(item => item.label);

	// the registered component, rendered in the detected (kebab) casing
	expect(labels).toContain('camel-comp');
	// no phantom auto-import duplicate: accepting it would insert a second
	// `import CamelComp from './CamelComp.vue';` next to the existing one
	expect(labels).not.toContain('CamelComp');
});

test('auto-import is still offered for a not-yet-imported component', async () => {
	const completions = await requestCompletionList(`
		<script setup lang="ts">
		</script>

		<template>
			<camel|
		</template>
	`);
	const item = completions.items.find(item => item.label === 'CamelComp');
	expect(item).toBeDefined();
	// inserted in the casing detected from the template, imported by its real name
	expect(item!.textEdit && 'newText' in item!.textEdit ? item!.textEdit.newText : undefined).toBe('camel-comp');
});

const openedDocuments: TextDocument[] = [];

afterEach(async () => {
	const server = await getLanguageServer();
	for (const document of openedDocuments) {
		await server.close(document.uri);
	}
	openedDocuments.length = 0;
});

async function requestCompletionList(content: string) {
	const offset = content.indexOf('|');
	expect(offset).toBeGreaterThanOrEqual(0);
	content = content.slice(0, offset) + content.slice(offset + 1);

	const server = await getLanguageServer();
	await server.tsserver.message({
		seq: server.nextSeq(),
		type: 'request',
		command: 'configure',
		arguments: {
			preferences: {
				includeCompletionsForModuleExports: true,
				includeCompletionsWithInsertText: true,
			},
		},
	});

	const uri = URI.file(`${testWorkspacePath}/tsconfigProject/fixture.vue`).toString();
	const document = await server.open(uri, 'vue', content);
	if (openedDocuments.every(d => d.uri !== document.uri)) {
		openedDocuments.push(document);
	}
	const completions = await server.vueserver.sendCompletionRequest(document.uri, document.positionAt(offset));
	expect(completions).toBeDefined();
	return completions!;
}
