import type { RequestEvent } from '@sveltejs/kit';
import { OpError } from '$lib/core/operations/errors.js';
import { queryParam, readJson, requireApi, runApiOp, toResponse } from '../../_lib.js';

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const lang = queryParam(event, 'lang', { required: true });
		if (!lang) throw new OpError('VALIDATION', 'Invalid query parameter: lang.');
		return await runApiOp('recipes.get', auth, { recipeId: event.params.id, lang });
	} catch (error) {
		return toResponse(error);
	}
}

export async function PATCH(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const body = await readJson(event);
		return await runApiOp('recipes.edit', auth, { recipeId: event.params.id, data: body.data });
	} catch (error) {
		return toResponse(error);
	}
}

export async function DELETE(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const body = await readJson(event);
		return await runApiOp('recipes.delete', auth, {
			recipeId: event.params.id,
			restore: body.restore
		});
	} catch (error) {
		return toResponse(error);
	}
}
