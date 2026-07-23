/**
 * Contact / misc island documentation
 */

import type { ComponentDoc } from './types';

export const islandContactDocs: ComponentDoc[] = [
  {
    name: 'ContactFormIsland',
    category: 'Islands',
    description:
      'React island for the contact form with validation, submission, and success/error states.',
    filePath: 'src/features/contact/ContactFormIsland.tsx',
    examples: [{ title: 'Contact form', code: '<ContactFormIsland client:only="react" />' }],
    accessibility: ['Form labels associated with inputs', 'Error messages announced via aria-live'],
    tags: ['react', 'island', 'form', 'contact'],
    visualTier: 'quiet',
    tokenDependencies: ['--color-field-bg', '--color-border', '--color-error', '--color-success'],
  },
];
