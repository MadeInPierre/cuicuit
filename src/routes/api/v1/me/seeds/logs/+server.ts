import type { RequestEvent } from '@sveltejs/kit';
import { queryParam, requireApi, runApiOp, toResponse } from '../../../_lib.js';

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const limitRaw = queryParam(event, 'limit');
		return runApiOp('billing.logs', auth, limitRaw === null ? {} : { limit: Number(limitRaw) });
	} catch (error) {
		return toResponse(error);
	}
}
