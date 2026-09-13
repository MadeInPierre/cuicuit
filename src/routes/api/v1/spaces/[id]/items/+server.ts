import type { RequestEvent } from '@sveltejs/kit';
import { OpError } from '$lib/core/operations/errors.js';
import { queryParam, readJson, requireApi, runApiOp, toResponse } from '../../../_lib.js';

function requiredLanguageId(event: RequestEvent): number {
	const raw = queryParam(event, 'languageId', { required: true });
	const languageId = Number(raw);
	if (!Number.isInteger(languageId)) {
		throw new OpError('VALIDATION', 'Query parameter `languageId` must be an integer.');
	}
	return languageId;
}

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		return await runApiOp('plans.list-items', auth, {
			spaceId: event.params.id as string,
			languageId: requiredLanguageId(event)
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
