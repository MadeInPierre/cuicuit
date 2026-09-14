import { json, type RequestEvent } from '@sveltejs/kit';
import { OpError } from '$lib/core/operations/errors.js';
import type { PlanMealRow, ShoppingIngredient } from '$lib/core/operations/plans/list-meals.js';
import { generateShoppingList } from '$lib/core/operations/plans/shopping-list.js';
import { runOp } from '$lib/core/operations/registry.js';
import { queryParam, requireApi, toResponse } from '../../../_lib.js';

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		try {
			const { ctx } = auth;
			const lang = queryParam(event, 'lang', { required: true });
			if (!lang) {
				throw new OpError('VALIDATION', 'Query parameter `lang` is required (e.g. `en-US`).');
			}
			const spaceId = event.params.id as string;
			const meals = await runOp<unknown, PlanMealRow[]>('plans.list-meals', ctx, {
				spaceId,
				lang
			});
			const items = await runOp<unknown, ShoppingIngredient[]>('plans.list-items', ctx, {
				spaceId,
				lang
			});
			return json({ meals, items, combined: generateShoppingList(meals, items) });
		} finally {
			auth.cleanup();
		}
	} catch (error) {
		return toResponse(error);
	}
}
