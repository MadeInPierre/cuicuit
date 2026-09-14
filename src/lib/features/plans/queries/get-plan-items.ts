import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import {
	listItemsOp,
	type ListItemsInput,
	type ListItemsOutput,
	type PlanItemRow
} from '$lib/core/operations/plans/list-items.js';

// Thin adapter over the `plans.list-items` op. Keeps the legacy chainable
// `.is('deleted_at', null)` shape used by `active-space.svelte.ts` (the op already
// excludes soft-deleted items, so the filter args are accepted and ignored).

import type { LanguageCode } from '$lib/shared/language.js';

export function getShoppingListItems(spaceId: string, lang: LanguageCode) {
	return {
		is: async (_column: string, _value: null) => {
			// Accepted and ignored: the op already excludes soft-deleted rows.
			void _column;
			void _value;
			const data = await runOp<ListItemsInput, ListItemsOutput>(
				listItemsOp.name,
				await getClientCtx(),
				{ spaceId, lang }
			);
			return { data, error: null };
		}
	};
}

export type ShoppingListItem = PlanItemRow;
