import type { ProjectCard } from './card.ts';

export const OBSIDIAN_STATS_URL = 'https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugin-stats.json';

function checkedCount(value: unknown): number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid download count');
	return value;
}

/** The same totals used by the official Obsidian community plugin directory. */
export function obsidianDownloads(stats: unknown, id: string): number {
	const entry = (stats as Record<string, { downloads?: unknown }> | null)?.[id];
	return checkedCount(entry?.downloads);
}

/** Read the English store's visible user count; do not confuse it with ratings. */
export function chromeUsers(html: string): number {
	const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
	const match = /\b([\d,]+)\s+users\b/.exec(text);
	if (!match) throw new Error('Chrome Web Store user count was not found');
	return checkedCount(Number(match[1]!.replaceAll(',', '')));
}

/** A failed request aborts rendering, leaving the last saved count available for --offline. */
export async function fetchDownloads(downloads: NonNullable<ProjectCard['downloads']>): Promise<number> {
	const url = downloads.source === 'obsidian' ? OBSIDIAN_STATS_URL
		: `https://chromewebstore.google.com/detail/${encodeURIComponent(downloads.id)}?hl=en`;
	const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
	if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
	return downloads.source === 'obsidian' ? obsidianDownloads(await response.json(), downloads.id) : chromeUsers(await response.text());
}
