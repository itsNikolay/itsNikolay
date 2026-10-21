// The project card for a GitHub profile README: a poster in a dark and a light theme, one for each GitHub theme.
// ProjectCard is the card's signature (SIGNATURE.md, schema/card.schema.json); src/render.ts renders it to PNG.
import { CARD_ICONS, type CardIcon } from './icons.ts';

export { CARD_ICONS, type CardIcon };

/** ProjectCard v1: one cards/<slug>/card.json per project. */
export interface ProjectCard {
	version: 1;
	/** GitHub owner/name of the project; the card links there. */
	repository: string;
	/** Project name, ends with a dot. At most 2 lines (about 44 characters). */
	headline: string;
	/** What the project gives the user. At most 2 lines (about 120 characters). */
	sub: string;
	/** Label of the pill button. */
	cta: string;
	/** Bottom-left signature, usually the GitHub user. */
	owner: string;
	/** Up to 3 icons, bottom right: platform, language, kind. */
	icons: CardIcon[];
	/** Crop of the picture, in percent. */
	image: {
		/** Horizontal focus, 0–100. */
		x: number;
		/** Vertical focus, 0–100. */
		y: number;
		/** 100–220. */
		zoom: number;
		/** Share of the card height the picture covers, 45–72. */
		height: number;
	};
}

/** dark is card.png, the default image; light is card-light.png, shown on GitHub's light theme. */
export type CardTheme = 'dark' | 'light';
export const CARD_THEMES: CardTheme[] = ['dark', 'light'];
/** The rendered file of a card or of the header in a theme. */
export const themeFile = (name: string, theme: CardTheme) => `${name}${theme === 'light' ? '-light' : ''}.png`;

/** The colours of a theme as CSS custom properties; --fade is the card colour the picture fades through. */
export const PALETTES: Record<CardTheme, string> = {
	dark: '--card: #191c22; --ink: #f3efe6; --sub: rgba(243, 239, 230, .7); --foot: rgba(243, 239, 230, .82); --line: rgba(243, 239, 230, .45); --fade: rgba(25, 28, 34, .75); --ring: rgba(255, 255, 255, .1);',
	light: '--card: #f4f1ea; --ink: #191c22; --sub: rgba(25, 28, 34, .7); --foot: rgba(25, 28, 34, .82); --line: rgba(25, 28, 34, .4); --fade: rgba(244, 241, 234, .75); --ring: rgba(25, 28, 34, .1);',
};

/** The repository that hosts the rendered cards. */
export const CARDS_REPOSITORY = 'itsNikolay/itsNikolay';
/** 5:7, sharp at the 250 px a profile README shows it at. */
export const CARD_WIDTH = 750, CARD_HEIGHT = 1050;
/** Art that fills the picture at the default height 1:1: 750 × 598. */
export const CARD_ART_HEIGHT = 57;

const ranges = { x: [0, 100], y: [0, 100], zoom: [100, 220], height: [45, 72] } as const;

/** Checks raw card.json against the signature and returns it typed; every error names the field. */
export function parseCard(input: unknown): ProjectCard {
	const card = input as ProjectCard;
	if (!card || typeof card !== 'object') throw new Error('card.json must be an object');
	if (card.version !== 1) throw new Error('Card version must be 1');
	if (typeof card.repository !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(card.repository)) throw new Error('Card repository must be owner/name');
	for (const key of ['headline', 'sub', 'cta', 'owner'] as const)
		if (typeof card[key] !== 'string' || !card[key].trim()) throw new Error(`Card needs a ${key}`);
	if (!Array.isArray(card.icons) || card.icons.length > 3) throw new Error('Card icons must be a list of up to 3 keys');
	for (const icon of card.icons) if (!Object.hasOwn(CARD_ICONS, icon)) throw new Error(`Unknown card icon: ${String(icon)}. Known: ${Object.keys(CARD_ICONS).join(', ')}`);
	if (!card.image || typeof card.image !== 'object') throw new Error('Card needs an image crop');
	for (const [key, [min, max]] of Object.entries(ranges) as [keyof typeof ranges, readonly [number, number]][]) {
		const value = card.image[key];
		if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`Card image.${key} must be a number from ${min} to ${max}`);
	}
	return card;
}

/** A starting card.json for owner/name; the headline comes from the repository name. */
export function newCard(repository: string): ProjectCard {
	const match = /^([\w.-]+)\/([\w.-]+)$/.exec(repository);
	if (!match) throw new Error('Expected the repository as owner/name');
	const [, owner, name] = match as unknown as [string, string, string];
	const title = name.split(/[-_.]+/).filter(Boolean).map((word) => word[0]!.toUpperCase() + word.slice(1)).join(' ');
	return {
		version: 1, repository, headline: `${title}.`,
		sub: 'One or two plain sentences on what it gives the user.',
		cta: 'View on GitHub', owner, icons: ['github'],
		image: { x: 50, y: 50, zoom: 100, height: CARD_ART_HEIGHT },
	};
}

const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escape = (text: string) => text.replace(/[&<>"']/g, (char) => entities[char]!);

export const SPARK = '<svg class="spark" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0C5.4 3.6 6.4 4.6 10 5 6.4 5.4 5.4 6.4 5 10 4.6 6.4 3.6 5.4 0 5 3.6 4.6 4.6 3.6 5 0Z"/></svg>';
const ARROW = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const icon = (key: CardIcon) => `<svg class="icon" viewBox="0 0 24 24" role="img" aria-label="${escape(CARD_ICONS[key].name)}"><path d="${CARD_ICONS[key].d}"/></svg>`;

/**
 * The card as a 750 × 1050 page in a theme. Transparent rounded corners and a hairline ring in the ink
 * colour keep its edge on a background of the same tone.
 * `fontFaces` is CSS with the @font-face rules for Playfair Display and Instrument Sans.
 * A `framed` picture sits in a rounded panel instead of fading into the card: a dark screenshot on the light card.
 */
export function cardHtml(card: ProjectCard, artSrc: string, fontFaces = '', theme: CardTheme = 'dark', framed = false) {
	const { x, y, zoom, height } = card.image;
	return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces}
:root { ${PALETTES[theme]}
	--serif: 'Playfair Display', 'Times New Roman', serif; --sans: 'Instrument Sans', 'Helvetica Neue', Arial, sans-serif; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${CARD_WIDTH}px; height: ${CARD_HEIGHT}px; background: transparent; overflow: hidden; }
.card { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 26px; background: var(--card); color: var(--ink); font-family: var(--sans); }
.media { position: absolute; inset: 0 0 auto; height: var(--media); overflow: hidden; }
.media img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: var(--fx) var(--fy); transform: scale(var(--zoom)); transform-origin: var(--fx) var(--fy); }
.media::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 0%, transparent 50%, var(--fade) 80%, var(--card) 100%); }
.framed .media { inset: 24px 24px auto; height: calc(var(--media) - 40px); border-radius: 14px; }
.framed .media::after { display: none; }
.framed .copy { top: calc(var(--media) + 6px); }
.copy { position: absolute; left: 40px; right: 40px; top: calc(var(--media) - 22px); display: grid; gap: 18px; justify-items: start; }
.headline { font: 400 64px/1.06 var(--serif); letter-spacing: -.012em; text-wrap: balance; }
.sub { font-size: 26px; line-height: 1.4; color: var(--sub); max-width: 92%; }
.pill { margin-top: 12px; display: inline-flex; align-items: center; gap: 12px; padding: 13px 27px; border: 1.5px solid var(--line); border-radius: 99px; font-size: 24px; line-height: 1.2; }
.arrow { width: 25px; height: 25px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.foot { position: absolute; left: 40px; right: 40px; bottom: 36px; display: flex; justify-content: space-between; align-items: center; gap: 24px; font-size: 26px; color: var(--foot); white-space: nowrap; }
.icons { display: flex; align-items: center; gap: 21px; }
.icon { width: 42px; height: 42px; fill: currentColor; display: block; }
.spark { width: 18px; height: 18px; fill: currentColor; opacity: .8; }
.ring { position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 2px var(--ring); pointer-events: none; }
</style></head><body>
<article class="card${framed ? ' framed' : ''}" style="--fx: ${x}%; --fy: ${y}%; --zoom: ${zoom / 100}; --media: ${height}%">
	<div class="media"><img src="${escape(artSrc)}" alt=""></div>
	<div class="copy">
		<h1 class="headline">${escape(card.headline)}</h1>
		<p class="sub">${escape(card.sub)}</p>
		<span class="pill">${escape(card.cta)}${ARROW}</span>
	</div>
	<div class="foot"><span class="owner">${escape(card.owner)}</span><span class="icons">${card.icons.map(icon).join(SPARK)}</span></div>
	<div class="ring"></div>
</article>
</body></html>`;
}

const title = (card: ProjectCard) => card.headline.replace(/\.$/, '');

/** A <picture> that shows `light` on GitHub's light theme and `dark` everywhere else. */
export function themedImage(dark: string, light: string, width: number, alt: string) {
	return `<picture><source media="(prefers-color-scheme: light)" srcset="${light}"><img src="${dark}" width="${width}" alt="${escape(alt)}"></picture>`;
}

/** The profile README code for one card: the images in this repository, linked to the project. */
export function snippet(slug: string, card: ProjectCard) {
	const image = (theme: CardTheme) => `https://raw.githubusercontent.com/${CARDS_REPOSITORY}/main/cards/${slug}/${themeFile('card', theme)}`;
	return `<a href="https://github.com/${card.repository}">${themedImage(image('dark'), image('light'), 250, `${title(card)} — ${card.sub}`)}</a>`;
}

/** cards/README.md: every card with its preview and profile README snippet, sorted by headline. */
export function gallery(cards: { slug: string; card: ProjectCard }[]) {
	const sorted = [...cards].sort((a, b) => a.card.headline.localeCompare(b.card.headline));
	return [
		'# Cards',
		'',
		'<!-- Generated by npm run render. Do not edit by hand. -->',
		'',
		'Paste a snippet into your profile README. It shows the light card on the light GitHub theme and the dark one elsewhere. Several snippets in one `<p>` line up and wrap on narrow screens.',
		'',
		...sorted.flatMap(({ slug, card }) => [
			`## ${title(card)}`,
			'',
			`<img src="${slug}/card.png" width="250" alt="${escape(`${title(card)} — ${card.sub}`)}"> <img src="${slug}/card-light.png" width="250" alt="The light card">`,
			'',
			'```html',
			snippet(slug, card),
			'```',
			'',
		]),
	].join('\n');
}
