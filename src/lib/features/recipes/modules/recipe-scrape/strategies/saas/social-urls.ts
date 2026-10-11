/**
 * Social-media URL detection for the social strategies (ScrapeCreators, Supadata).
 *
 * Dependency-free (no `$env`, no SvelteKit) so it stays unit-testable.
 * Matching is hostname-based and tolerant: subdomains (`m.`, `vm.`, `www.`),
 * short links (`youtu.be`, `vm.tiktok.com`, `fb.watch`) and tracking query
 * params (`?cplk=…`, `?si=…`) all match — only the hostname matters.
 */

export type SocialPlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter';

const PLATFORM_HOSTS: Array<{ platform: SocialPlatform; hosts: string[] }> = [
    // YouTube (watch, shorts, live, embed, music, nocookie, youtu.be)
    { platform: 'youtube', hosts: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'] },
    // TikTok (incl. vm./vt./m. shares)
    { platform: 'tiktok', hosts: ['tiktok.com'] },
    // Instagram (reels, posts, tv)
    { platform: 'instagram', hosts: ['instagram.com', 'instagr.am'] },
    // Facebook (reels, posts, shares, fb.watch)
    { platform: 'facebook', hosts: ['facebook.com', 'fb.com', 'fb.watch'] },
    // X / Twitter
    { platform: 'twitter', hosts: ['x.com', 'twitter.com'] }
];

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

function normalizedHost(url: string): string | null {
    const hostname = extractHostname(url);
    return hostname ? normalizeHostname(hostname) : null;
}

/**
 * Whether a URL points at a supported social platform (YouTube, TikTok,
 * Instagram, Facebook, X/Twitter), in any common shape: full/short/mobile
 * links, with or without tracking params.
 */
export function isSocialUrl(url: string): boolean {
    return socialPlatform(url) !== null;
}

/** Which supported platform a URL points at, or null when unsupported. */
export function socialPlatform(url: string): SocialPlatform | null {
    const host = normalizedHost(url);
    if (!host) return null;
    for (const { platform, hosts } of PLATFORM_HOSTS) {
        if (hosts.some((social) => host === social || host.endsWith(`.${social}`))) {
            return platform;
        }
    }
    return null;
}
