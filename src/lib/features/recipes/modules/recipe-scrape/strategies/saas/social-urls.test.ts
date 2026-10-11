import { describe, expect, it } from 'vitest';

import { isSocialUrl } from './social-urls';

describe('isSocialUrl', () => {
    const social = [
        // YouTube variants
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/shorts/dQw4w9WgXcQ?feature=share',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ?si=abc123',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://www.youtube.com/live/dQw4w9WgXcQ',
        // TikTok variants
        'https://www.tiktok.com/@user/video/7234567890123456789',
        'https://vm.tiktok.com/AAAAZZZZZ/',
        'https://vt.tiktok.com/ZS6Tis/',
        'https://m.tiktok.com/v/7234567890123456789.html',
        // Instagram variants
        'https://www.instagram.com/reel/DJwd01lpmMs/?cplk=aHZ4M3B0M3dmZzht',
        'https://www.instagram.com/p/C1234567890/',
        'https://www.instagram.com/tv/C1234567890?utm_source=ig_web_copy_link',
        'https://m.instagram.com/reel/DJwd01lpmMs/',
        // Facebook variants
        'https://www.facebook.com/reel/682865820350105/',
        'https://www.facebook.com/share/v/123123123123123/',
        'https://m.facebook.com/examplepage/posts/123123123123123/',
        'https://fb.watch/abc123XYZ/',
        // X / Twitter variants
        'https://x.com/username/status/1234567890123456789',
        'https://twitter.com/username/status/1234567890123456789',
        'https://mobile.twitter.com/username/status/1234567890123456789?s=20',
        // Scheme-less paste
        'youtu.be/dQw4w9WgXcQ'
    ];

    const notSocial = [
        'https://www.marmiton.org/recettes/recette_pates_123.aspx',
        'https://cooking.nytimes.com/recipes/123-pasta',
        'https://example.com/youtube.com/watch?v=x',
        'https://notyoutube.com/watch?v=x',
        'https://fakex.com/user/status/123',
        'not a url at all',
        ''
    ];

    it.each(social)('matches %s', (url) => {
        expect(isSocialUrl(url)).toBe(true);
    });

    it.each(notSocial)('rejects %s', (url) => {
        expect(isSocialUrl(url)).toBe(false);
    });
});
