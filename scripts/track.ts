import { appendFileSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32 } from 'node:zlib';
import { startVitest } from 'vitest/node';

const vitest = await startVitest('test', ['track'], { update: true, run: true, env: { TEST_TRACK: '1' } });
await vitest?.close();

const dir = path.dirname(fileURLToPath(import.meta.url));
const TARGET_FILE = path.join(dir, '..', 'tests', '__snapshots__', 'track.spec.ts.snap');
const hex = (crc32(readFileSync(TARGET_FILE)) >>> 0).toString(16).padStart(8, '0');
console.log(`track hash: ${hex}`);

const out = process.env.GITHUB_OUTPUT;
if (out) {
	appendFileSync(out, `track_hash=${hex}\n`);
}
