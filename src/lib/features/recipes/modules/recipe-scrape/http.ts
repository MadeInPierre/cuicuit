/**
 * Shared HTTP fetching for the direct strategy. Browser-ish headers keep us
 * close to what a normal visitor would send; failures are classified so the
 * orchestrator can decide whether to keep trying more expensive strategies.
 */

export type FetchOutcome = 'success' | 'blocked' | 'timeout' | 'error';

export interface FetchHtmlResult {
    status: number;
    body: string;
    outcome: FetchOutcome;
    /** Final URL after redirects, when available. */
    finalUrl?: string;
}

const BROWSER_HEADERS: Record<string, string> = {
    'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br'
};

export async function fetchHtml(
    url: string,
    options: { timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<FetchHtmlResult> {
    const { timeoutMs = 10_000, headers = {} } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            headers: { ...BROWSER_HEADERS, ...headers },
            signal: controller.signal,
            redirect: 'follow'
        });

        const body = await response.text();
        const outcome: FetchOutcome =
            response.status === 403 ||
                response.status === 429 ||
                (response.status >= 500 && response.status <= 599)
                ? 'blocked'
                : response.ok
                    ? 'success'
                    : 'error';

        return { status: response.status, body, outcome, finalUrl: response.url };
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            return { status: 0, body: '', outcome: 'timeout' };
        }
        return { status: 0, body: '', outcome: 'error' };
    } finally {
        clearTimeout(timer);
    }
}
