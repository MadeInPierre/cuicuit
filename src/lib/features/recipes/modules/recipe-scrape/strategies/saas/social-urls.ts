/**
 * Social-media URL detection for the Supadata strategy.
 *
 * Dependency-free (no `$env`, no SvelteKit) so it stays unit-testable.
 * Matching is hostname-based and tolerant: subdomains (`m.`, `vm.`, `www.`),
 * short links (`youtu.be`, `vm.tiktok.com`, `fb.watch`) and tracking query
 * params (`?cplk=…`, `?si=…`) all match — only the hostname matters.
 */

const SOCIAL_HOSTS = [
    // YouTube (watch, shorts, live, embed, music, nocookie, youtu.be)
    'youtube.com',
    'youtu.be',
    'youtube-nocookie.com',
    // TikTok (incl. vm./vt./m. shares)
    'tiktok.com',
    // Instagram (reels, posts, tv)
    'instagram.com',
    'instagr.am',
    // Facebook (reels, posts, shares, fb.watch)
    'facebook.com',
    'fb.com',
    'fb.watch',
    // X / Twitter
    'x.com',
    'twitter.com'
] as const;

/** Generic prefixes that never change the site identity. */
const IGNORABLE_PREFIXES = ['www.', 'm.', 'mobile.'] as const;

function extractHostname(raw: string): string | null {
    const input = raw.trim();
    try {
        return new URL(input).hostname;
    } catch {
        // Missing scheme (e.g. pasted "youtu.be/abc") — try again with https://.
        try {
            return new URL(`https://${input}`).hostname;
        } catch {
            return null;
        }
    }
}

function normalizeHostname(hostname: string): string {
    let host = hostname.toLowerCase();
    // Strip a trailing dot ("youtube.com.") and port ("x.com:443").
    host = host.replace(/\.:?$/, '').replace(/:\d+$/, '');
    for (const prefix of IGNORABLE_PREFIXES) {
        if (host.startsWith(prefix)) {
            host = host.slice(prefix.length);
            break;
        }
    }
    return host;
}

/**
 * Whether a URL points at a supported social platform (YouTube, TikTok,
 * Instagram, Facebook, X/Twitter), in any common shape: full/short/mobile
 * links, with or without tracking params.
 */
export function isSocialUrl(url: string): boolean {
    const hostname = extractHostname(url);
    if (!hostname) return false;
    const host = normalizeHostname(hostname);
    return SOCIAL_HOSTS.some((social) => host === social || host.endsWith(`.${social}`));
}
