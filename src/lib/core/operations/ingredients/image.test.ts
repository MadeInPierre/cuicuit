import { describe, expect, it } from 'vitest';

import sharp from 'sharp';

import {
	buildImagePrompt,
	candidatePath,
	candidatePrefix,
	ingredientImagePath,
	isCandidateOf
} from './image-shared.js';
import { ICON_SIZE, resizeToIcon } from './image-resize.js';
import { buildImageRequestBody, IMAGE_MODEL_DEFAULT, parseImageResponse } from './openai-images.js';

/**
 * M5 image unit tests — pure functions only, no network, no DB, no key.
 * Live generation is a manual spot-check once OPENAI_API_KEY exists.
 */

/** 1×1 transparent PNG — stands in for generated files without any fixture. */
export const TINY_PNG_B64 =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export function tinyPng(): Uint8Array {
	return Uint8Array.from(atob(TINY_PNG_B64), (c) => c.charCodeAt(0));
}

describe('image paths', () => {
	const id = '11111111-1111-4111-8111-111111111111';

	it('keeps the active-image convention unchanged', () => {
		expect(ingredientImagePath(id)).toBe(`images/${id}.jpg`);
	});

	it('builds candidate paths under candidates/{id}/', () => {
		expect(candidatePrefix(id)).toBe(`candidates/${id}/`);
		expect(candidatePath(id, 'stamp')).toBe(`candidates/${id}/stamp.png`);
	});

	it('accepts only direct .png children of the ingredient folder', () => {
		expect(isCandidateOf(id, `candidates/${id}/abc.png`)).toBe(true);
		expect(isCandidateOf(id, `images/${id}.jpg`)).toBe(false);
		expect(isCandidateOf(id, `candidates/other-id/abc.png`)).toBe(false);
		expect(isCandidateOf(id, `candidates/${id}/nested/abc.png`)).toBe(false);
		expect(isCandidateOf(id, `candidates/${id}/abc.jpg`)).toBe(false);
		expect(isCandidateOf(id, `candidates/${id}/../evil.png`)).toBe(false);
	});
});

describe('image prompt', () => {
	it('builds a short catalog-style prompt', () => {
		const prompt = buildImagePrompt({
			nameGeneral: 'red apples',
			nameSingular: 'red apple',
			namePlural: 'red apples',
			aisle: 'fruits-vegetables'
		});
		expect(prompt).toContain('red apples');
		expect(prompt).toContain('red apple');
		expect(prompt).toContain('fruits vegetables');
		expect(prompt).toContain('transparent background');
		// Compact: prompts cost money.
		expect(prompt.length).toBeLessThan(500);
	});

	it('works without aisle or singular/plural', () => {
		const prompt = buildImagePrompt({ nameGeneral: 'salt' });
		expect(prompt).toContain('salt');
		expect(prompt.length).toBeLessThan(500);
	});
});

describe('image request body (batch-ready)', () => {
	it('builds one images API body with PNG + transparency', () => {
		const body = buildImageRequestBody('a red apple', IMAGE_MODEL_DEFAULT);
		expect(body).toMatchObject({
			model: IMAGE_MODEL_DEFAULT,
			prompt: 'a red apple',
			n: 1,
			output_format: 'png',
			background: 'transparent'
		});
	});

	it('parses b64 image data, rejects empty payloads', () => {
		const bytes = new TextEncoder().encode('fake-jpeg');
		let binary = '';
		for (const b of bytes) binary += String.fromCharCode(b);
		const parsed = parseImageResponse({ data: [{ b64_json: btoa(binary) }] }, IMAGE_MODEL_DEFAULT);
		expect(parsed.bytes).toEqual(bytes);
		expect(() => parseImageResponse({ data: [] }, IMAGE_MODEL_DEFAULT)).toThrow();
	});
});

describe('icon resize', () => {
	it('cover-fits any source to a 128×128 PNG', async () => {
		const out = await resizeToIcon(tinyPng());
		const meta = await sharp(out).metadata();
		expect(meta.width).toBe(ICON_SIZE);
		expect(meta.height).toBe(ICON_SIZE);
		expect(meta.format).toBe('png');
		expect(ICON_SIZE).toBe(128);
	});
});
