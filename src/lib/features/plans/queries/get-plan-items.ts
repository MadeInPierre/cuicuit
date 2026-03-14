import { supabase } from '$lib/shared/db/supabase-client';

export function getShoppingListItems(spaceId: string, lang: string = 'fr-FR') {
	return (
		supabase
			.from('space_plan_shopping_lists')
			.select(
				`*, 
				ingredient:ingredients!ingredient_id(
					*,
					translations:ingredient_translations(
						*,
						language:languages(*)
					)
				)`
			)
			.eq('space_id', spaceId)
			// Only get translations in the user language
			.eq('ingredient.translations.language.lang', lang)
			.order('updated_at', { ascending: false })
	);
}

export type ShoppingListItem = NonNullable<
	Awaited<ReturnType<typeof getShoppingListItems>>['data']
>[number];
