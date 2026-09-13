/**
 * Credit (seed) gate for paid operations.
 *
 * STUB (M1): pass-through that logs the feature name so call sites compile.
 * M2 moves the real `consumeCredits()` logic here and calls it from inside the
 * two import ops (`recipes.import-from-url`, `recipes.import-from-text`).
 * Adapters must NEVER call credit consumption directly.
 */
export async function withCredits<T>(
	feature: string,
	seeds: number,
	fn: () => Promise<T>
): Promise<T> {
	console.debug(`[credits:stub] feature=${feature} seeds=${seeds} — no charge in M1`);
	return fn();
}
