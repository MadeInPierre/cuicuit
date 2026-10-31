import { describe, expect, it } from 'vitest';

import { readSseFrames, type SseFrame } from './sse';

function streamFrom(chunks: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	return new ReadableStream({
		start(controller) {
			for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
			controller.close();
		}
	});
}

async function collect(chunks: string[]): Promise<SseFrame[]> {
	const frames: SseFrame[] = [];
	for await (const frame of readSseFrames(streamFrom(chunks))) frames.push(frame);
	return frames;
}

describe('readSseFrames', () => {
	it('handles frames split across chunks', async () => {
		expect(await collect(['data: {"a":1}', '\n\n'])).toEqual([{ event: null, data: '{"a":1}' }]);
	});

	it('reads multiple frames from one chunk and preserves event names', async () => {
		expect(await collect(['data: 1\n\nevent: error\ndata: {"code":"X"}\n\n'])).toEqual([
			{ event: null, data: '1' },
			{ event: 'error', data: '{"code":"X"}' }
		]);
	});

	it('joins multi-line data and ignores comments', async () => {
		expect(await collect([': ping\ndata: line1\ndata: line2\n\n'])).toEqual([
			{ event: null, data: 'line1\nline2' }
		]);
	});

	it('handles CRLF line endings', async () => {
		expect(await collect(['data: ok\r\n\r\n'])).toEqual([{ event: null, data: 'ok' }]);
	});

	it('handles CRLF split across chunks', async () => {
		expect(await collect(['data: ok\r', '\n\r\n'])).toEqual([{ event: null, data: 'ok' }]);
	});
});
