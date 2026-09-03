/**
 * Parent-width-driven layout math for the recipes carousel.
 *
 * The carousel paginates recipes into fixed-size "pages" (rows x columns) and
 * renders each page in a CSS grid with `repeat(columns, 1fr)`. To avoid the
 * ragged partial rows that come from mixing viewport breakpoints with a
 * flexible grid, ALL layout decisions derive from the measured parent width:
 *   - `columns` adapts so each card (gap included) stays within
 *     [MIN_CARD_WIDTH, MAX_CARD_WIDTH]
 *   - `rows` is parent-width driven (2 below `WIDE_THRESHOLD`, 3 above) unless
 *     overridden with a `rows` prop
 *   - pagination chunks recipes into exact `columns x rows` pages
 */

export const MIN_CARD_WIDTH = 180;
export const MAX_CARD_WIDTH = 200;
/** Matches the `gap-3` class used on the recipe grid. */
export const GAP = 12;
export const DEFAULT_ROWS_SMALL = 2;
export const DEFAULT_ROWS_WIDE = 3;
export const WIDE_THRESHOLD = 768;
export const MAX_PAGES = 4;
export const MIN_COLUMNS = 2;
/** Used before the ResizeObserver fires (SSR / first paint). */
export const FALLBACK_WIDTH = 640;

export interface CarouselLayout {
	columns: number;
	rows: number;
	pageSize: number;
}

/**
 * Pick the number of grid columns so each card (gap included) lands within
 * [MIN_CARD_WIDTH, MAX_CARD_WIDTH]. `width` is the grid content width.
 */
export function computeColumns(width: number): number {
	if (!Number.isFinite(width) || width <= 0) return 1;

	// Smallest column count whose cards are not wider than MAX_CARD_WIDTH.
	const minForMax = Math.max(MIN_COLUMNS, Math.ceil((width + GAP) / (MAX_CARD_WIDTH + GAP)));
	// Largest column count whose cards are not narrower than MIN_CARD_WIDTH.
	const maxForMin = Math.max(MIN_COLUMNS, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP)));

	// A valid range exists: pick the count closest to the midpoint card size.
	if (minForMax <= maxForMin) {
		const mid = (MIN_CARD_WIDTH + MAX_CARD_WIDTH) / 2;
		const closest = Math.round((width + GAP) / (mid + GAP));
		return Math.min(maxForMin, Math.max(minForMax, closest));
	}

	// Dead zone: no integer column count fits within [MIN, MAX].
	// Prefer fewer, wider cards (never below MIN) so the grid always fills
	// the entire width available.
	return maxForMin;
}

/**
 * Compute the grid layout for the given measured parent width.
 * `rows` is auto-derived from the width unless `rowsOverride` is provided.
 */
export function computeLayout(width: number, rowsOverride?: number): CarouselLayout {
	const columns = computeColumns(width);
	const rows = Math.max(
		1,
		rowsOverride ?? (width < WIDE_THRESHOLD ? DEFAULT_ROWS_SMALL : DEFAULT_ROWS_WIDE)
	);
	return { columns, rows, pageSize: columns * rows };
}

export interface CarouselPages<T> {
	/** Pages of recipes. The last page may be short — a See All card fills the last cell. */
	pages: T[][];
	/** Whether a See All card should be rendered as the last cell of the last page. */
	showSeeAll: boolean;
	/** Number of recipes actually rendered (excludes the See All card cell). */
	renderedCount: number;
}

/**
 * Chunk `recipes` into whole `pageSize`-sized pages, capped at `maxPages`.
 * A See All card is shown when there are leftover recipes or more full pages
 * than the cap. It occupies the LAST grid cell of the LAST page so every page
 * stays a clean `pageSize` cells wide.
 */
export function chunkIntoPages<T>(
	recipes: T[],
	pageSize: number,
	maxPages = MAX_PAGES,
	showSeeAll = true
): CarouselPages<T> {
	const count = recipes.length;
	const fullPages = Math.floor(count / pageSize);
	const hasRemainder = count % pageSize !== 0;

	const pagesToShow = Math.min(Math.max(fullPages, 0), maxPages);
	const seeAll = showSeeAll && (hasRemainder || fullPages > maxPages);
	const renderedCount = pagesToShow * pageSize - (seeAll ? 1 : 0);

	const pages: T[][] = [];
	let offset = 0;
	for (let i = 0; i < pagesToShow; i++) {
		const isLast = i === pagesToShow - 1;
		// Keep the last cell of the last page free for the See All card.
		const pageSizeHere = isLast && seeAll ? pageSize - 1 : pageSize;
		pages.push(recipes.slice(offset, offset + pageSizeHere));
		offset += pageSizeHere;
	}

	return { pages, showSeeAll: seeAll, renderedCount };
}
