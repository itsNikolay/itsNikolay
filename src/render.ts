// npm run render [-- slug ...]: renders cards/<slug>/card.json + art.(png|jpg|webp) to cards/<slug>/card.png and
// card-light.png (750 × 1050) in headless Chromium, then rewrites the cards/README.md gallery. Without slugs it
// also renders header/header.json to header/header.png and header-light.png.
import { chromium } from 'playwright';
import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { CARD_HEIGHT, CARD_THEMES, CARD_WIDTH, cardHtml, gallery, parseCard, themeFile, type CardTheme, type ProjectCard } from './card.ts';
import { HEADER_HEIGHT, HEADER_WIDTH, headerHtml, parseHeader } from './header.ts';

const root = new URL('..', import.meta.url).pathname;
const cardsDir = join(root, 'cards');
const types: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

/** The fonts ship in fonts/, so every machine renders the same card. */
async function fontFaces() {
	const face = async (family: string, file: string) =>
		`@font-face { font-family: '${family}'; src: url(data:font/ttf;base64,${(await readFile(join(root, 'fonts', file))).toString('base64')}) format('truetype'); font-weight: 100 900; }`;
	return [await face('Playfair Display', 'PlayfairDisplay.ttf'), await face('Instrument Sans', 'InstrumentSans.ttf')].join('\n');
}

/** The light card takes art-light.* when there is one and frames the dark card's art otherwise. */
async function findArt(slug: string, theme: CardTheme) {
	for (const name of theme === 'light' ? ['art-light', 'art'] : ['art'])
		for (const ext of Object.keys(types)) {
			const path = join(cardsDir, slug, `${name}${ext}`);
			try { await access(path); return path; } catch { /* try the next extension */ }
		}
	throw new Error(`cards/${slug} has no art.png, art.jpg or art.webp`);
}

const all = (await readdir(cardsDir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
const wanted = process.argv.slice(2);
for (const slug of wanted) if (!all.includes(slug)) throw new Error(`No card cards/${slug}. Start one with npm run new -- owner/name`);

const cards: { slug: string; card: ProjectCard }[] = [];
for (const slug of all) {
	try { cards.push({ slug, card: parseCard(JSON.parse(await readFile(join(cardsDir, slug, 'card.json'), 'utf8'))) }); }
	catch (error) { throw new Error(`cards/${slug}/card.json: ${(error as Error).message}`); }
}

const faces = await fontFaces();
const browser = await chromium.launch().catch((error: Error) => {
	throw new Error(`Cannot start Chromium. Run npx playwright install chromium first.\n${error.message}`);
});
const failures: string[] = [];
try {
	const page = await browser.newPage({ viewport: { width: CARD_WIDTH, height: CARD_HEIGHT } });
	for (const { slug, card } of cards.filter(({ slug }) => !wanted.length || wanted.includes(slug))) for (const theme of CARD_THEMES) {
		const artPath = await findArt(slug, theme);
		const art = `data:${types[extname(artPath)]};base64,${(await readFile(artPath)).toString('base64')}`;
		const framed = theme === 'light' && !/[/\\]art-light\.\w+$/.test(artPath);
		await page.setContent(cardHtml(card, art, faces, theme, framed), { waitUntil: 'load' });
		await page.evaluate(() => document.fonts.ready);
		const problems = await page.evaluate(() => {
			const lines = (selector: string) => { const el = document.querySelector(selector)!; return Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)); };
			const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
			return [
				!document.fonts.check("64px 'Playfair Display'") && 'Playfair Display did not load',
				!document.fonts.check("26px 'Instrument Sans'") && 'Instrument Sans did not load',
				lines('.headline') > 2 && 'the headline is longer than 2 lines',
				lines('.sub') > 2 && 'the sub is longer than 2 lines',
				box('.copy').bottom > box('.foot').top - 16 && 'the text runs into the footer',
				box('.owner').right > box('.icons').left - 16 && 'the owner runs into the icons',
			].filter((problem) => problem);
		});
		if (problems.length) { failures.push(`cards/${slug}: ${problems.join('; ')}`); break; }
		await page.screenshot({ path: join(cardsDir, slug, themeFile('card', theme)), omitBackground: true });
		console.log(`Rendered cards/${slug}/${themeFile('card', theme)}`);
	}
	if (!wanted.length) {
		const header = parseHeader(JSON.parse(await readFile(join(root, 'header', 'header.json'), 'utf8')));
		await page.setViewportSize({ width: HEADER_WIDTH, height: HEADER_HEIGHT });
		for (const theme of CARD_THEMES) {
			await page.setContent(headerHtml(header, faces, theme), { waitUntil: 'load' });
			await page.evaluate(() => document.fonts.ready);
			const tooWide = await page.evaluate(() => Array.from(document.querySelectorAll('.header > *')).some((el) => el.scrollWidth > window.innerWidth - 60));
			if (tooWide) { failures.push('header: a line is wider than the header'); break; }
			await page.screenshot({ path: join(root, 'header', themeFile('header', theme)), omitBackground: true });
			console.log(`Rendered header/${themeFile('header', theme)}`);
		}
	}
} finally {
	await browser.close();
}
await writeFile(join(cardsDir, 'README.md'), gallery(cards));
console.log('Updated cards/README.md');
if (failures.length) {
	console.error(`\nNot rendered, shorten the text or lower image.height:\n${failures.join('\n')}`);
	process.exit(1);
}
