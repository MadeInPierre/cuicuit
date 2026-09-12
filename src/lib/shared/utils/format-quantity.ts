import type { ParsedSearchInput } from '$lib/features/recipes/modules/parse-ingredients/parse';
import type { IngredientProcessed } from '$lib/features/recipes/modules/parse-ingredients/process';
import { mapUnitUnregionizedToRegionized, unitLabels, type UnitUnregionized } from './quantity';

/**
 * Single place for all quantity display logic.
 *
 * Amounts render with unicode fractions (½, ⅓, …), units render as human
 * labels ('' for whole, 'teaspoon' for tsp, …).
 */

const FRACTION_GLYPHS: Array<[number, string]> = [
	[0.125, '⅛'],
	[0.2, '⅕'],
	[0.25, '¼'],
	[1 / 3, '⅓'],
	[0.375, '⅜'],
	[0.4, '⅖'],
	[0.5, '½'],
	[0.6, '⅗'],
	[0.625, '⅝'],
	[2 / 3, '⅔'],
	[0.75, '¾'],
	[0.8, '⅘'],
	[0.875, '⅞']
];

const FRACTION_TOLERANCE = 0.03;

/** Format a numeric amount with unicode fractions, e.g. 0.5 -> '½', 2.5 -> '2 ½'. */
export function formatQuantityAmount(amount: number | null | undefined): string {
	if (amount === null || amount === undefined || !Number.isFinite(amount)) return '';
	if (Number.isInteger(amount)) return String(amount);

	const sign = amount < 0 ? '-' : '';
	const abs = Math.abs(amount);
	const wholePart = Math.trunc(abs);
	const decimalPart = abs - wholePart;

	const match = FRACTION_GLYPHS.find(
		([value]) => Math.abs(decimalPart - value) < FRACTION_TOLERANCE
	);
	if (match) {
		const [, glyph] = match;
		return wholePart > 0 ? `${sign}${wholePart} ${glyph}` : `${sign}${glyph}`;
	}

	// Fallback: up to 2 decimals without trailing zeros.
	return `${sign}${String(parseFloat(abs.toFixed(2)))}`;
}

/** Format a unit key (regionized or not) as a display label. 'whole'/empty -> ''. */
export function formatUnit(unit: string | null | undefined, short = false): string {
	if (!unit) return '';
	const trimmed = unit.trim();
	if (!trimmed || trimmed === 'whole') return '';

	const unregionized: UnitUnregionized | undefined =
		(mapUnitUnregionizedToRegionized as Record<string, UnitUnregionized | undefined>)[trimmed] ??
		(trimmed as UnitUnregionized);

	if (!unregionized || unregionized === 'whole') return '';

	if (short) return unregionized ?? trimmed;
	return unitLabels[unregionized] ?? trimmed;
}

/** Combine an amount and a unit, e.g. (0.5, 'cup') -> '½ cup', (2, 'whole') -> '2'. */
export function formatQuantity(
	amount: number | null | undefined,
	unit: string | null | undefined,
	shortUnit = false
): string {
	return `${formatQuantityAmount(amount)} ${formatUnit(unit, shortUnit)}`.trim();
}

/** True when the amount calls for a plural ingredient name. */
export function isPluralAmount(amount: number | null | undefined): boolean {
	return (amount ?? 0) > 1;
}

export type QuantityLike = Pick<NonNullable<ParsedSearchInput['quantity']>, 'amount' | 'unitKey'>;

/** Format a parsed `{ amount, unitKey }` quantity object. */
export function formatParsedQuantity(quantity: QuantityLike | null | undefined): string {
	if (!quantity) return '';
	return formatQuantity(quantity.amount, quantity.unitKey);
}

/**
 * Description shown under an {@link IngredientProcessed} match card:
 * quantity + unit + free-text description, e.g. '½ cup chopped'.
 */
export function formatProcessedIngredientDescription(
	processed: IngredientProcessed | null | undefined
): string {
	if (!processed) return '';
	const quantity = formatParsedQuantity(processed.parsed.quantity);
	const description = processed.parsed.description?.trim() ?? '';
	return `${quantity} ${description}`.trim().replace(/\s+/g, ' ');
}

/** Plural flag for an {@link IngredientProcessed}, based on its parsed amount. */
export function isPluralProcessed(processed: IngredientProcessed | null | undefined): boolean {
	return isPluralAmount(processed?.parsed.quantity?.amount);
}
