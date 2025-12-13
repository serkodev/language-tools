import { describe, expect, test } from 'vitest';

const TRACK_LIST: { repo: string; path: string }[] = [
	{ repo: 'microsoft/TypeScript', path: 'src/services/types.ts' },
];

test.skipIf(process.env.TEST_TRACK !== '1')(`snapshot`, async () => {
	const promises = TRACK_LIST.map(async item => ({
		...item,
		commit: await getRemoteCommit(item.repo, item.path),
	}));
	const snapshot = await Promise.all(promises);
	expect(snapshot).toMatchSnapshot();
});

async function getRemoteCommit(repo: string, path: string): Promise<string | undefined> {
	console.log('fetching', repo, path);
	const response = await fetch(`https://api.github.com/repos/${repo}/commits?path=${path}&per_page=1`);
	const data = await response.json();
	return data[0]?.sha || '';
}
