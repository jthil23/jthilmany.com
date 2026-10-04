/** Average adult reading speed for instructional prose, in words per minute. */
const WORDS_PER_MINUTE = 220;

/** Estimated whole minutes to read a Markdown body (minimum one). */
export function readingMinutes(markdown: string | undefined): number {
  if (!markdown) return 1;
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|-]/g, ' ');
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.]*/gu)?.length ?? 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
