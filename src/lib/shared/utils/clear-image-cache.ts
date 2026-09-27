/**
 * Clears the on-device (service-worker) image caches.
 *
 * Image files are content-addressed (uuid filenames), so cached entries stay
 * valid forever — this is only needed to force a refresh (e.g. an ingredient
 * icon was replaced under the same URL) or to free disk space. The next
 * image view re-caches on demand.
 */
export const IMAGE_CACHE_NAMES = ['recipe-images', 'ingredient-images'] as const;

export async function clearImageCaches(): Promise<boolean> {
	try {
		if (typeof window === 'undefined' || !('caches' in window)) return false;
		await Promise.all(IMAGE_CACHE_NAMES.map((name) => caches.delete(name)));
		return true;
	} catch {
		return false;
	}
}
