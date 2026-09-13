import type { RequestEvent } from '@sveltejs/kit';
import { OpError } from '$lib/core/operations/errors.js';
import { queryParam, requireApi, runApiOp, toResponse } from '../_lib.js';

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const startRaw = queryParam(event, 'start');
		const endRaw = queryParam(event, 'end');
		const start = startRaw === null || startRaw === '' ? undefined : Number(startRaw);
		const end = endRaw === null || endRaw === '' ? undefined : Number(endRaw);
		if (start !== undefined && Number.isNaN(start))
			throw new OpError('VALIDATION', 'Invalid query parameter: start.');
		if (end !== undefined && Number.isNaN(end))
			throw new OpError('VALIDATION', 'Invalid query parameter: end.');
		return await runApiOp('ingredients.list', auth, { start, end });
	} catch (error) {
		return toResponse(error);
	}
}
