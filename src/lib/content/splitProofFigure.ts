/** Split a proof line into a lead figure and caption for typographic plaques. */
export function splitProofFigure(proof: string): { figure: string; caption: string } {
  const trimmed = proof.trim().replace(/[.,;:]+$/, '');
  if (!trimmed) return { figure: '', caption: '' };

  const figure = pickFigure(trimmed);
  if (!figure) {
    const lead = trimmed.match(/^(\d[\d,.]*\+?)(?:\s*[—–-]\s*|\s+)(.+)$/);
    if (lead) return { figure: lead[1], caption: shortenCaption(lead[2].trim()) };
    return { figure: '', caption: trimmed };
  }

  return { figure, caption: captionWithoutFigure(trimmed, figure) };
}

const MONEY_RE = /\$\d[\d,.]*[MBKmbk]?\+?/;
const PERCENT_RE = /\d+(?:\.\d+)?%/;
const RATE_RE = />?\d[\d,.]*k\b|\d[\d,.]*x\b/i;

function pickFigure(text: string): string | undefined {
  return text.match(MONEY_RE)?.[0] ?? text.match(PERCENT_RE)?.[0] ?? text.match(RATE_RE)?.[0];
}

function captionWithoutFigure(text: string, figure: string): string {
  const stripped = text
    .replace(figure, ' ')
    .replace(/\s+by\s+/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,;:—–-]+|[\s.,;:—–-]+$/g, '')
    .replace(/\bincreased\s+(?=after|during|in|across|for|from)/i, '')
    .replace(/^(Secured|Maintained|Improved)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return shortenCaption(stripped);
}

function shortenCaption(caption: string): string {
  const clause = caption.split(/\s+with\s+|\s+thanks\s+to\s+/i)[0]?.trim() ?? caption;
  const words = clause.split(/\s+/).filter(Boolean);
  if (words.length > 12) return words.slice(0, 10).join(' ');
  return clause;
}
