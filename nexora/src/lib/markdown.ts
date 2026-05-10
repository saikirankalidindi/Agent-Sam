import { marked } from 'marked';

/**
 * Converts a markdown string to an HTML string using `marked`.
 *
 * Falls back to returning the raw content string unchanged if the parser
 * throws (e.g. on severely malformed input), so callers and error boundaries
 * always receive a usable string rather than an exception.
 *
 * @param content - The markdown source string to render.
 * @returns An HTML string, or the original `content` string on parse error.
 */
export function renderMarkdown(content: string): string {
  try {
    // marked.parse returns a string synchronously in v5+ when no async
    // options are passed. Cast is safe here because we are not using the
    // async/callback overload.
    return marked.parse(content) as string;
  } catch {
    return content;
  }
}
