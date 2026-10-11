import { describe, expect, it } from 'vitest';

import { parseSharedContent } from './parse-shared-content';

describe('parseSharedContent', () => {
	it('imports a pure shared URL', () => {
		expect(parseSharedContent({ url: 'https://www.youtube.com/watch?v=abc123' })).toEqual({
			kind: 'url',
			url: 'https://www.youtube.com/watch?v=abc123'
		});
	});

	it('finds the URL inside shared text (TikTok-style share)', () => {
		expect(
			parseSharedContent({ text: 'Check this out https://vm.tiktok.com/AAAAZZZZZ/ so good' })
		).toEqual({ kind: 'url', url: 'https://vm.tiktok.com/AAAAZZZZZ/' });
	});

	it('finds the URL inside the title when url/text are empty', () => {
		expect(parseSharedContent({ title: 'https://youtu.be/dQw4w9WgXcQ' })).toEqual({
			kind: 'url',
			url: 'https://youtu.be/dQw4w9WgXcQ'
		});
	});

	it('strips trailing punctuation over-captured from surrounding text', () => {
		expect(parseSharedContent({ text: '(see https://example.com/pasta).' })).toEqual({
			kind: 'url',
			url: 'https://example.com/pasta'
		});
	});

	it('falls back to text import for raw recipe text without a URL', () => {
		const text = 'My grandma pasta: 200g flour, 2 eggs. Mix, knead, rest 30min, roll and boil.';
		expect(parseSharedContent({ text })).toEqual({ kind: 'text', text });
	});

	it('returns empty for blank shares and photo-style shares (no url/text)', () => {
		expect(parseSharedContent({})).toEqual({ kind: 'empty' });
		expect(parseSharedContent({ url: '', text: '  ', title: null })).toEqual({ kind: 'empty' });
		expect(parseSharedContent({ text: 'hi' })).toEqual({ kind: 'empty' });
	});
});
