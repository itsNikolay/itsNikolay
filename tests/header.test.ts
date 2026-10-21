import { describe, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { headerHtml, headerSnippet, parseHeader, type ProfileHeader } from '../src/header.ts';

const header: ProfileHeader = { name: 'Nikolay Ponomarev.', tagline: 'Useful tools.', stack: ['Ruby on Rails', 'TypeScript'] };

describe('headerHtml', () => {
	test('shows the name, tagline and stack separated by sparks', () => {
		const html = headerHtml(header);
		expect(html).toContain('>Nikolay Ponomarev.<');
		expect(html).toContain('>Useful tools.<');
		expect(html).toContain('Ruby on Rails</span>');
		expect(html.match(/class="spark"/g)).toHaveLength(1);
	});

	test('puts the brand icon of the same name in its colour in front of a stack item', () => {
		const html = headerHtml({ ...header, stack: ['Ruby on Rails', 'TypeScript', 'Elixir'] });
		expect(html).toContain('<span class="item"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true" style="--brand: #d30001"><path d="M.741');
		expect(html).toContain('style="--brand: #3178c6"');
		expect(html).toContain('<span class="item">Elixir</span>');
	});

	test('sets the ink of the theme on a transparent page', () => {
		expect(headerHtml(header)).toContain('--ink: #f3efe6');
		expect(headerHtml(header, '', 'light')).toContain('--ink: #191c22');
		expect(headerHtml(header)).toContain('background: transparent');
	});

	test('escapes HTML', () => {
		expect(headerHtml({ ...header, name: '<b>x</b>' })).toContain('&lt;b&gt;x&lt;/b&gt;');
	});
});

describe('headerSnippet', () => {
	test('shows the light header on the light theme', () => {
		expect(headerSnippet(header)).toBe('<picture><source media="(prefers-color-scheme: light)" srcset="header/header-light.png"><img src="header/header.png" width="510" alt="Nikolay Ponomarev — Useful tools. Ruby on Rails, TypeScript."></picture>');
	});
});

describe('parseHeader', () => {
	test('accepts header/header.json', async () => {
		const raw: unknown = JSON.parse(await readFile('header/header.json', 'utf8'));
		expect(() => parseHeader(raw)).not.toThrow();
	});

	test('rejects a header without a name, tagline or a short stack', () => {
		expect(() => parseHeader({ ...header, name: '' })).toThrow(/name/);
		expect(() => parseHeader({ ...header, tagline: undefined })).toThrow(/tagline/);
		expect(() => parseHeader({ ...header, stack: ['a', 'b', 'c', 'd', 'e'] })).toThrow(/stack/);
	});
});
