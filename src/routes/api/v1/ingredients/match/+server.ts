import type { RequestEvent } from '@sveltejs/kit';
import { readJson, requireApi, runApiOp, toResponse } from '../../_lib.js';

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const body = await readJson(event);
		return await runApiOp('ingredients.match', auth, body);
	} catch (error) {
		return toResponse(error);
	}
}
