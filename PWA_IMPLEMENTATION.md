# Offline Web App Support - PWA Implementation

## Overview
Offline page loading support has been implemented using **vite-plugin-pwa** with Workbox service worker generation. The app will cache all `(app)/*` routes and serve them offline, while `(auth)/*` routes remain online-only.

## What Was Implemented

### 1. **vite-plugin-pwa Installation**
- Installed `vite-plugin-pwa` and `workbox-window` as dev dependencies
- Adds automatic service worker generation and PWA manifest support

### 2. **Vite Configuration** (`vite.config.ts`)
- Added `VitePWA` plugin with the following settings:
  - **registerType**: `'autoUpdate'` - Auto-updates SW when new version available
  - **strategies**: `'generateSW'` - Uses Workbox's `generateSW` strategy
  - **Manifest**: Basic PWA manifest with app name, icons, and display settings
  - **Workbox**:
    - `navigateFallback: '/offline.html'` - Shows offline page when navigating to uncached routes
    - `navigateFallbackDenylist: [/^\/api\//, /^\/(auth)\//]` - Excludes API and auth routes from offline fallback
    - `maximumFileSizeToCacheInBytes: 5 * 1024 * 1024` - Caches files up to 5MB
    - `globIgnores: ['**/stats.html']` - Ignores large build artifact
    - Runtime caching for Google Fonts with `CacheFirst` strategy

### 3. **Offline Fallback Page** (`static/offline.html`)
- Custom offline page with:
  - User-friendly messaging
  - Home navigation button
  - Styled with gradients and modern UI
  - Served when user tries to access an uncached page without connection

### 4. **Service Worker Registration** (`src/routes/+layout.svelte`)
- Added `onMount` hook to register SW using vite-plugin-pwa's virtual module
- Imports `registerSW` from `'virtual:pwa-register'` at runtime
- Graceful fallback if registration fails

### 5. **Environment Variables** (`.env`)
- Added required environment variables to allow build completion:
  - `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_URL_CLOUD`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `PUBLIC_CUICUIT_SCRAPER_URL`
  - `MISTRAL_API_KEY`

## Build Output
Generated files in `.svelte-kit/output/client/`:
- **`sw.js`** (17 KB) - Service worker with precached app shell and Workbox runtime
- **`manifest.webmanifest`** - PWA manifest for installability
- **`offline.html`** (1.9 KB) - Offline fallback page
- **`workbox-*.js`** - Workbox modules for runtime caching

## How It Works

### Caching Strategy
1. **App Shell**: All `(app)/*` pages are precached in the service worker
2. **Offline Fallback**: Navigating to uncached routes without connection serves `offline.html`
3. **API/Auth Routes**: Explicitly excluded via `navigateFallbackDenylist`
4. **Third-Party Assets**: Google Fonts cached with `CacheFirst` strategy for offline use
5. **Dynamic Updates**: Service worker auto-updates on new deployments

### User Experience
- **Online**: App loads normally, SW updates in background
- **Offline**: Cached pages load instantly; uncached routes show offline page
- **Reconnect**: App continues working; new content available after refresh

## What's NOT Included
- ❌ Data caching (handled separately as per requirements)
- ❌ `(auth)` route caching (requires active connection)
- ❌ `(marketing)` route caching (routes configured to require online access)
- ❌ Dynamic updates to precached assets

## Testing Recommendations

### Development
```bash
npm run build
npm run preview
# Open DevTools → Application → Service Workers to verify registration
```

### Verify in DevTools
1. **Application → Manifest**: Check manifest.json is valid
2. **Application → Service Workers**: Confirm SW is registered and running
3. **Application → Cache Storage**: View precached app files
4. **Network → Offline**: Toggle offline mode to test fallback

### Offline Testing
1. Load `http://localhost:4173`
2. Go to DevTools → Network → check "Offline"
3. Navigate around `(app)/*` pages - should load from cache
4. Try to navigate to new route - should show offline.html
5. Check DevTools → Application → Cache Storage for cached resources

## Future Enhancements
- Add data caching for read-only API endpoints (when ready)
- Cache `(marketing)` routes for static pages
- Implement incremental static regeneration (ISR) for frequently updated pages
- Add SW update notification to user
- Cache strategy customization per route

## Files Modified
- `vite.config.ts` - Added VitePWA plugin
- `src/routes/+layout.svelte` - Added SW registration
- `static/offline.html` - New offline page
- `.env` - Environment variables (created)
- `package.json` - New dependencies (vite-plugin-pwa, workbox-window)

## References
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
