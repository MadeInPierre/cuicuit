import type { RequestEvent } from '@sveltejs/kit';
import { requireApi, runApiOp, toResponse } from '../../_lib.js';

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		return runApiOp('billing.balance', auth, {});
	} catch (error) {
		return toResponse(error);
	}
}
