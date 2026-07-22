/**
 * Shared heading size ladder — used by IntroCopy and SectionHeading.
 * Semantic names are preferred; Tailwind size aliases map for back-compat.
 */
export const HEADING_SIZE_CLASSES = {
  identity: 'text-5xl leading-[1.02] sm:text-6xl md:text-7xl lg:text-[5rem] xl:text-[5.5rem]',
  hero: 'text-4xl leading-[1.1] sm:text-5xl md:text-6xl',
  display: 'text-3xl leading-snug sm:text-4xl md:text-5xl',
  section: 'text-2xl leading-snug sm:text-3xl md:text-4xl',
  title: 'text-xl leading-snug sm:text-2xl',
  subtitle: 'text-lg leading-snug sm:text-xl',
} as const;

export type HeadingSize = keyof typeof HEADING_SIZE_CLASSES;

/** Legacy Tailwind-ish aliases → semantic ladder */
export const HEADING_SIZE_ALIASES = {
  '5xl': 'hero',
  '4xl': 'display',
  '3xl': 'section',
  '2xl': 'title',
  xl: 'subtitle',
} as const satisfies Record<string, HeadingSize>;

export type HeadingSizeAlias = keyof typeof HEADING_SIZE_ALIASES;
export type HeadingSizeInput = HeadingSize | HeadingSizeAlias;

export function resolveHeadingSize(size: HeadingSizeInput): HeadingSize {
  if (size in HEADING_SIZE_CLASSES) return size as HeadingSize;
  return HEADING_SIZE_ALIASES[size as HeadingSizeAlias];
}

export function headingSizeClass(size: HeadingSizeInput): string {
  return HEADING_SIZE_CLASSES[resolveHeadingSize(size)];
}
