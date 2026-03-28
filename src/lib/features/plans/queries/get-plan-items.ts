import { supabase } from '$lib/shared/db/supabase-client';

export function getShoppingListItems(spaceId: string, languageId: number) {
	return (
		supabase
			.from('space_plan_shopping_lists')
			.select(
				`*, 
				ingredient:ingredients!ingredient_id(
					*,
					translations:ingredient_translations(
						*,
						language:languages!language_id(lang)
					)
				)`
			)
			.eq('space_id', spaceId)
			// Only get translations in the user language
			.eq('ingredient.translations.language_id', languageId)
			.order('updated_at', { ascending: false })
	);
}

export type ShoppingListItem = NonNullable<
	Awaited<ReturnType<typeof getShoppingListItems>>['data']
>[number];
