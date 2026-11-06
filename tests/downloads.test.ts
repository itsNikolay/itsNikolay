import { expect, test } from 'vitest';
import { obsidianDownloads, chromeUsers } from '../src/downloads.ts';

test('reads the total for the requested Obsidian plugin, including zero', () => {
	expect(obsidianDownloads({ first: { downloads: 1224 }, second: { downloads: 0 } }, 'first')).toBe(1224);
	expect(obsidianDownloads({ second: { downloads: 0 } }, 'second')).toBe(0);
	expect(() => obsidianDownloads({}, 'missing')).toThrow();
	expect(() => obsidianDownloads({ first: { downloads: -1 } }, 'first')).toThrow();
});

test('reads Chrome users from visible listing text without counting ratings', () => {
	expect(chromeUsers('<div>4.8 (123 ratings)</div><div>10,000 users</div>')).toBe(10000);
	expect(chromeUsers('<div>0 users</div>')).toBe(0);
	expect(() => chromeUsers('<div>No listing</div>')).toThrow();
});
