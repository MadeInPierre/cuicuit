import type { RequestEvent } from '@sveltejs/kit';
import { OpError } from '$lib/core/operations/errors.js';
import { readJson, requireApi, runApiOp, toResponse } from '../../../../_lib.js';

function toBool(value: unknown): boolean | undefined {
	if (typeof value === 'boolean') return value;
	if (value === 'true' || value === '1') return true;
	if (value === 'false' || value === '0') return false;
	return undefined;
}

export async function PATCH(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const body = await readJson(event);
		const mealId = event.params.mealId as string;
		if ('servings' in body) {
			return await runApiOp('plans.update-servings', auth, {
				...body,
				spaceId: event.params.id as string,
				mealId
			});
		}
		if ('position' in body) {
			return await runApiOp('plans.move-meal', auth, { ...body, mealId });
		}
		throw new OpError(
			'VALIDATION',
			'Provide `servings` (+`recipeServings`, `ingredients`) or `position`.'
		);
	} catch (error) {
		return toResponse(error);
	}
}

export async function DELETE(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const body = await readJson(event);
		const params = event.url.searchParams;
		return await runApiOp('plans.delete-meal', auth, {
			mealId: event.params.mealId as string,
			undo: toBool('undo' in body ? body.undo : params.get('undo')),
			cooked: toBool('cooked' in body ? body.cooked : params.get('cooked'))
		});
	} catch (error) {
		return toResponse(error);
	}
}
