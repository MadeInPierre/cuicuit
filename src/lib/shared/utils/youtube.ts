/**
 * YouTube URL helpers — pure functions shared by the UI and the server-side
 * import pipeline (which needs the fallback URLs to avoid storing YouTube's
 * grey placeholder image).
 */

/** Extracts the 11-character video id from any YouTube URL shape. */
export function youtubeVideoId(url: string): string | null {
	if (typeof url !== 'string' || !url.trim()) {
		return null;
	}

	const trimmedUrl = url.trim();

	try {
		const withProtocol =
			/^https?:\/\//i.test(trimmedUrl) || /^\/\//.test(trimmedUrl)
				? trimmedUrl
				: `https://${trimmedUrl}`;

		const parsedUrl = new URL(withProtocol);
		const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
		const isYoutubeHost =
			hostname === 'youtube.com' ||
			hostname === 'm.youtube.com' ||
			hostname === 'youtu.be' ||
			hostname === 'youtube-nocookie.com' ||
			hostname === 'music.youtube.com' ||
			hostname.endsWith('.youtube.com') ||
			hostname.endsWith('.youtu.be');

		if (!isYoutubeHost) {
			return null;
		}

		const videoId =
			parsedUrl.searchParams.get('v') ||
			(() => {
				const segments = parsedUrl.pathname.split('/').filter(Boolean);
				for (let i = 0; i < segments.length; i++) {
					const segment = segments[i];
					if (['embed', 'shorts', 'live', 'v', 'e'].includes(segment)) {
						const next = segments[i + 1];
						if (next && /^[a-zA-Z0-9_-]{11}$/.test(next)) {
							return next;
						}
					}
					if (/^[a-zA-Z0-9_-]{11}$/.test(segment)) {
						return segment;
					}
				}
				return null;
			})();

		return videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : null;
	} catch {
		return null;
	}
}

/** Best-quality YouTube thumbnail. Only exists for videos with an HD rendition. */
export function youtubeUrlToThumbnailUrl(url: string): string | null {
	const videoId = youtubeVideoId(url);
	return videoId ? `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp` : null;
}

/**
 * Lower-quality YouTube thumbnails that exist for every video, best first.
 * Used when `youtubeUrlToThumbnailUrl` 404s (low-res uploads) — YouTube then
 * serves a 120×90 grey placeholder instead of the real image.
 */
export function youtubeThumbnailFallbacks(url: string): string[] {
	const videoId = youtubeVideoId(url);
	return videoId
		? [
				`https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
				`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
			]
		: [];
}
