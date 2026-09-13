import type { RequestEvent } from '@sveltejs/kit';
import { queryParam, requireApi, runApiOp, toResponse } from '../../../_lib.js';

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		return await runApiOp('plans.recommendations', auth, {
			spaceId: event.params.id as string,
			lang: queryParam(event, 'lang', { required: true })
		});
	} catch (error) {
		return toResponse(error);
	}
}
