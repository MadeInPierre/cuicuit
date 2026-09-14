import type { RequestEvent } from '@sveltejs/kit';
import { OpError } from '$lib/core/operations/errors.js';
import { queryParam, readJson, requireApi, runApiOp, toResponse } from '../../../_lib.js';

function requiredLang(event: RequestEvent): string {
	const raw = queryParam(event, 'lang', { required: true });
	if (!raw) {
		throw new OpError('VALIDATION', 'Query parameter `lang` is required (e.g. `en-US`).');
	}
	return raw;
}

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		return await runApiOp('plans.list-items', auth, {
			spaceId: event.params.id as string,
			lang: requiredLang(event)
		});
	} catch (error) {
		return toResponse(error);
	}
}

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const { ctx } = auth;
		const body = await readJson(event);
		return await runApiOp('plans.add-item', auth, {
			...body,
			spaceId: event.params.id as string,
			createdBy: ctx.userId
		});
	} catch (error) {
		return toResponse(error);
	}
}
