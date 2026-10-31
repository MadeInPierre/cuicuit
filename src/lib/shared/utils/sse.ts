/** One server-sent event: optional event name + the joined `data:` payload. */
export type SseFrame = { event: string | null; data: string };

/**
 * Minimal SSE reader for `text/event-stream` responses. Handles frames split
 * across chunks, multi-line `data:`, comments, and CRLF line endings.
 */
export async function* readSseFrames(
	body: ReadableStream<Uint8Array>
): AsyncGenerator<SseFrame, void, unknown> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n');
			let boundary = buffer.indexOf('\n\n');
			while (boundary !== -1) {
				const frame = parseFrame(buffer.slice(0, boundary));
				buffer = buffer.slice(boundary + 2);
				if (frame) yield frame;
				boundary = buffer.indexOf('\n\n');
			}
		}

		buffer += decoder.decode();
		const frame = parseFrame(buffer);
		if (frame) yield frame;
	} finally {
		reader.releaseLock();
	}
}

function parseFrame(raw: string): SseFrame | null {
	let event: string | null = null;
	const data: string[] = [];

	for (const line of raw.split('\n')) {
		if (!line || line.startsWith(':')) continue;
		const colon = line.indexOf(':');
		const field = colon === -1 ? line : line.slice(0, colon);
		const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
		if (field === 'event') event = value;
		else if (field === 'data') data.push(value);
	}

	return data.length > 0 ? { event, data: data.join('\n') } : null;
}
