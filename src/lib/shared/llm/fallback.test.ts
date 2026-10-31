import { describe, expect, it, vi } from 'vitest';

import { withLlmStreamFailover } from './fallback';
import { getLlmProviders, type LlmProvider } from './providers';

vi.mock('./providers', () => ({ getLlmProviders: vi.fn() }));

const getProviders = vi.mocked(getLlmProviders);

function provider(id: string): LlmProvider {
	return { id, model: {} } as unknown as LlmProvider;
}

async function* okGenerator(values: number[]): AsyncGenerator<number> {
	for (const value of values) yield value;
}

/** A stream that errors on the very first pull (connection/auth failure shape). */
function failingStream(error: unknown): AsyncGenerator<number> {
	return {
		[Symbol.asyncIterator]() {
			return { next: () => Promise.reject(error) };
		}
	} as AsyncGenerator<number>;
}

async function collect(stream: AsyncGenerator<number>): Promise<number[]> {
	const values: number[] = [];
	for await (const value of stream) values.push(value);
	return values;
}

describe('withLlmStreamFailover', () => {
	it('falls back to the next provider when the first chunk fails', async () => {
		getProviders.mockReturnValue([provider('a'), provider('b')]);

		const result = await withLlmStreamFailover((p) =>
			p.id === 'a' ? failingStream(new Error('boom')) : okGenerator([1, 2])
		);

		expect(result.provider).toContain('b');
		expect(result.fallbackUsed).toBe(true);
		expect(await collect(result.stream)).toEqual([1, 2]);
	});

	it('re-injects the probe chunk so consumers see the full stream', async () => {
		getProviders.mockReturnValue([provider('a')]);

		const result = await withLlmStreamFailover(() => okGenerator([1, 2, 3]));

		expect(result.provider).toContain('a');
		expect(result.fallbackUsed).toBe(false);
		expect(await collect(result.stream)).toEqual([1, 2, 3]);
	});

	it('does not fail over after the first chunk succeeded', async () => {
		getProviders.mockReturnValue([provider('a'), provider('b')]);

		async function* partialThenFail(): AsyncGenerator<number> {
			yield 1;
			throw new Error('mid-stream failure');
		}

		const result = await withLlmStreamFailover((p) =>
			p.id === 'a' ? partialThenFail() : okGenerator([99])
		);

		expect(result.provider).toContain('a');
		await expect(collect(result.stream)).rejects.toThrow('mid-stream failure');
	});

	it('throws the last error when every provider fails before its first chunk', async () => {
		getProviders.mockReturnValue([provider('a'), provider('b')]);

		await expect(withLlmStreamFailover(() => failingStream(new Error('all down')))).rejects.toThrow(
			'all down'
		);
	});
});
