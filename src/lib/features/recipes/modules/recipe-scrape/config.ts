/**
 * Runtime configuration for the scraping sources.
 *
 * Every external source is optional: it is enabled only when its environment
 * variables are present. Uses `$env/dynamic/private` (runtime) so a missing
 * variable never breaks the build.
 */
import { env } from '$env/dynamic/private';

export const scraperConfig = {
    python: {
        baseUrl: env.PYTHON_SCRAPER_URL?.replace(/\/+$/, '')
    },
    geonode: {
        apiKey: env.GEONODE_API_KEY
    },
    firecrawl: {
        apiKey: env.FIRECRAWL_API_KEY
    }
} as const;

export const isPythonScraperEnabled = () => Boolean(scraperConfig.python.baseUrl);
export const isGeonodeEnabled = () => Boolean(scraperConfig.geonode.apiKey);
export const isFirecrawlEnabled = () => Boolean(scraperConfig.firecrawl.apiKey);
