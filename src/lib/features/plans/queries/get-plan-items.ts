import { supabase } from '$lib/shared/db/supabase-client';

export function getShoppingListItems(spaceId: string, languageId: number) {
	return (
		supabase
			.from('space_items')
			.select(
				`*, 
				author_profile:user_public_profiles(*),
				ingredient:ingredients!ingredient_id(
					id, slug, slug_general, aisle, hierarchy, base_unit, unit_frequencies, g_per_unit, g_per_ml,
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
