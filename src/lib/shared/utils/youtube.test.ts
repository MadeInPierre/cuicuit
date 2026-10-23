import { describe, expect, it } from 'vitest';

import {
	youtubeThumbnailFallbacks,
	youtubeUrlToThumbnailUrl,
	youtubeVideoId,
	youtubeWidescreenThumbnailFallbacks
} from './youtube.js';

describe('youtube thumbnails', () => {
	it('extracts the video id from common URL shapes', () => {
		expect(youtubeVideoId('https://www.youtube.com/watch?v=P0ullgo0Lnw')).toBe('P0ullgo0Lnw');
		expect(youtubeVideoId('https://youtu.be/P0ullgo0Lnw?si=abc')).toBe('P0ullgo0Lnw');
		expect(youtubeVideoId('https://www.youtube.com/shorts/P0ullgo0Lnw')).toBe('P0ullgo0Lnw');
		expect(youtubeVideoId('https://example.com/watch?v=P0ullgo0Lnw')).toBeNull();
	});

	it('builds the maxres URL plus guaranteed lower-quality fallbacks', () => {
		const url = 'https://www.youtube.com/watch?v=P0ullgo0Lnw';
		expect(youtubeUrlToThumbnailUrl(url)).toBe(
			'https://i.ytimg.com/vi_webp/P0ullgo0Lnw/maxresdefault.webp'
		);
		expect(youtubeThumbnailFallbacks(url)).toEqual([
			'https://i.ytimg.com/vi/P0ullgo0Lnw/hq720.jpg',
			'https://i.ytimg.com/vi/P0ullgo0Lnw/sddefault.jpg',
			'https://i.ytimg.com/vi/P0ullgo0Lnw/hqdefault.jpg',
			'https://i.ytimg.com/vi/P0ullgo0Lnw/mqdefault.jpg'
		]);
		expect(youtubeWidescreenThumbnailFallbacks(url)).toEqual([
			'https://i.ytimg.com/vi/P0ullgo0Lnw/hq720.jpg',
			'https://i.ytimg.com/vi/P0ullgo0Lnw/mqdefault.jpg'
		]);
		expect(youtubeThumbnailFallbacks('https://example.com')).toEqual([]);
	});
});
