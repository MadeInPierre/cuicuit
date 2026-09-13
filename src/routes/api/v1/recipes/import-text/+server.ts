import type { RequestEvent } from '@sveltejs/kit';
import { readJson, requireApi, streamApiOp, toResponse } from '../../_lib.js';

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const body = await readJson(event);
		return streamApiOp('recipes.import-from-text', auth, body);
	} catch (error) {
		return toResponse(error);
	}
}
