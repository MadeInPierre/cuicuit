/**
 * Minimal JSON-LD extraction helpers. We only care about
 * `application/ld+json` script blocks and locating a single Recipe node,
 * however it's nested (top-level, inside `@graph`, behind `mainEntity`, in
 * arrays, ...).
 */

const LD_JSON_SCRIPT_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Parse every JSON-LD script block on the page. Malformed blocks are skipped. */
export function extractLdJsonScripts(html: string): unknown[] {
    const blocks: unknown[] = [];
    for (const match of html.matchAll(LD_JSON_SCRIPT_RE)) {
        const raw = match[1]?.trim();
        if (!raw) continue;
        try {
            blocks.push(JSON.parse(raw));
        } catch {
            // Some sites inline invalid JSON-LD; ignore those blocks.
        }
    }
    return blocks;
}

function isRecipeNode(node: Record<string, unknown>): boolean {
    const type = node['@type'];
    const types = Array.isArray(type) ? type : [type];
    return types.some((t) => typeof t === 'string' && t.toLowerCase().includes('recipe'));
}

/**
 * Recursively walk arbitrary JSON-LD and return the first node whose @type is a
 * Recipe. Handles `@graph` arrays, `mainEntity` wrappers, and plain node arrays.
 */
export function findRecipeNode(data: unknown): Record<string, unknown> | null {
    if (Array.isArray(data)) {
        for (const item of data) {
            const found = findRecipeNode(item);
            if (found) return found;
        }
        return null;
    }

    if (!data || typeof data !== 'object') return null;
    const node = data as Record<string, unknown>;

    if (isRecipeNode(node)) return node;

    if (Array.isArray(node['@graph'])) {
        const found = findRecipeNode(node['@graph']);
        if (found) return found;
    }

    // Single-item wrappers commonly used by schema.org
    for (const key of ['mainEntity', 'mainEntityOfPage', 'itemListElement']) {
        const found = findRecipeNode(node[key]);
        if (found) return found;
    }

    return null;
}

/**
 * Extract a best-guess image URL from a Recipe node. Handles a plain string,
 * an ImageObject, or an array of either.
 */
export function extractRecipeImage(node: Record<string, unknown>): string | undefined {
    return unwrapImage(node['image']);
}

function unwrapImage(value: unknown): string | undefined {
    if (typeof value === 'string') return value;

    if (Array.isArray(value)) {
        for (const item of value) {
            const url = unwrapImage(item);
            if (url) return url;
        }
        return undefined;
    }

    if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        if (typeof obj['url'] === 'string') return obj['url'];
        if (typeof obj['contentUrl'] === 'string') return obj['contentUrl'];
    }

    return undefined;
}
