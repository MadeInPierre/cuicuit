/**
 * Markdown/HTML cleaning for the raw passthrough output.
 *
 * We strip image & link *targets* to save LLM tokens, but deliberately keep
 * their labels (alt text / link text) — those often carry useful context.
 */

/** Remove code blocks, image + link targets (keeping labels), and collapse whitespace. */
export function cleanMarkdown(markdown: string): string {
    return markdown
        // fenced + inline code blocks (rarely useful for a recipe)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`\n]*`/g, ' ')
        // HTML comments
        .replace(/<!--[\s\S]*?-->/g, ' ')
        // images: ![alt](url) -> alt
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        // reference-style images: ![alt][ref]
        .replace(/!\[([^\]]*)\]\[[^\]]*\]/g, '$1')
        // links: [text](url) -> text
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        // reference-style links: [text][ref]
        .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
        // autolinks <https://...>
        .replace(/<https?:\/\/[^>\s]+>/g, ' ')
        // collapse tabs/multiple spaces, drop excessive blank lines
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** Very light HTML → text fallback (provider gave HTML but no Markdown). */
export function htmlToText(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        // keep image alt text
        .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*>/gi, '$1')
        .replace(/<img[^>]*>/gi, ' ')
        // keep link text, drop href
        .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
        // strip remaining tags
        .replace(/<[^>]+>/g, ' ')
        // decode common entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
