// This shell page is used as a fallback for the service worker when a user navigates to a page that hasn't been cached yet when offline.
// See vite.config.ts for the corresponding workbox configuration.

// Include this page in the prerendering process so that it's available to the service worker immediately after the first build:
export const ssr = false;
export const prerender = true;
