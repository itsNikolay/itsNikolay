// The profile header: the name, one line on what the profile is about and the stack, set like the cards
// (src/card.ts) on a transparent background, so it sits on GitHub's page instead of in a box above it.
import { escape, PALETTES, SPARK, themedImage, themeFile, type CardTheme } from './card.ts';

/** header/header.json. */
export interface ProfileHeader {
	/** Ends with a dot, like a card headline. One line. */
	name: string;
	/** One line on what the profile is about. */
	tagline: string;
	/** Up to 4 technologies, shown in small capitals. */
	stack: string[];
}

/** Rendered at 3× the 510 px the README shows it at, the width of two cards side by side. */
export const HEADER_WIDTH = 1530, HEADER_HEIGHT = 390;
export const HEADER_SHOWN_WIDTH = 510;

export function parseHeader(input: unknown): ProfileHeader {
	const header = input as ProfileHeader;
	if (!header || typeof header !== 'object') throw new Error('header.json must be an object');
	for (const key of ['name', 'tagline'] as const)
		if (typeof header[key] !== 'string' || !header[key].trim()) throw new Error(`Header needs a ${key}`);
	if (!Array.isArray(header.stack) || header.stack.length > 4 || header.stack.some((item) => typeof item !== 'string' || !item.trim()))
		throw new Error('Header stack must be a list of up to 4 names');
	return header;
}

/** The header as a transparent page in a theme; the ink is the card's, so it reads on that GitHub theme. */
export function headerHtml(header: ProfileHeader, fontFaces = '', theme: CardTheme = 'dark') {
	return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces}
:root { ${PALETTES[theme]}
	--serif: 'Playfair Display', 'Times New Roman', serif; --sans: 'Instrument Sans', 'Helvetica Neue', Arial, sans-serif; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${HEADER_WIDTH}px; height: ${HEADER_HEIGHT}px; background: transparent; overflow: hidden; }
.header { height: 100%; display: grid; place-content: center; justify-items: center; gap: 30px; color: var(--ink); font-family: var(--sans); text-align: center; white-space: nowrap; }
.name { font: 400 132px/1 var(--serif); letter-spacing: -.012em; }
.tagline { font-size: 54px; line-height: 1.2; color: var(--sub); }
.stack { display: flex; align-items: center; gap: 30px; font-size: 36px; letter-spacing: .16em; text-transform: uppercase; color: var(--sub); }
.spark { width: 21px; height: 21px; fill: currentColor; opacity: .8; }
</style></head><body>
<header class="header">
	<h1 class="name">${escape(header.name)}</h1>
	<p class="tagline">${escape(header.tagline)}</p>
	<p class="stack">${header.stack.map((item) => `<span>${escape(item)}</span>`).join(SPARK)}</p>
</header>
</body></html>`;
}

/** The profile README code for the header. */
export function headerSnippet(header: ProfileHeader) {
	const alt = `${header.name.replace(/\.$/, '')} — ${header.tagline} ${header.stack.join(', ')}.`;
	return themedImage(`header/${themeFile('header', 'dark')}`, `header/${themeFile('header', 'light')}`, HEADER_SHOWN_WIDTH, alt);
}
