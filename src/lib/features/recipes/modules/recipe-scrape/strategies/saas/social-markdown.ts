/**
 * Shared markdown builder for social-media strategies (Supadata,
 * ScrapeCreators, ...). Both emit the same `# Title / Source / Author /
 * ## Caption / Tags / ## Transcript` shape so the LLM enrichment downstream
 * and the strict ingredient gate see identical input regardless of provider.
 */

/** Cap on the transcript portion so LLM input stays bounded; captions are kept whole. */
export const MAX_TRANSCRIPT_CHARS = 24_000;

export interface SocialMarkdownInput {
    url: string;
    title?: string | null;
    author?: string | null;
    caption?: string | null;
    tags?: string[] | null;
    transcript?: string | null;
}

export function buildSocialMarkdown(input: SocialMarkdownInput): string {
    const sections: string[] = [];
    const title = input.title?.trim();
    sections.push(`# ${title || 'Social media post'}`);
    sections.push(`Source: ${input.url}`);
    if (input.author?.trim()) sections.push(`Author: ${input.author.trim()}`);
    const caption = input.caption?.trim();
    if (caption) sections.push(`## Caption\n${caption}`);
    const tags = (input.tags ?? []).filter((tag) => tag.trim().length > 0);
    if (tags.length > 0) sections.push(`Tags: ${tags.join(', ')}`);
    const text = input.transcript?.trim();
    if (text) {
        const capped =
            text.length > MAX_TRANSCRIPT_CHARS
                ? `${text.slice(0, MAX_TRANSCRIPT_CHARS)}\n\n[transcript truncated]`
                : text;
        sections.push(`## Transcript\n${capped}`);
    }
    return sections.join('\n\n').trim();
}
