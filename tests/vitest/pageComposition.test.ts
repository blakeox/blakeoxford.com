import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');

const routeContracts = [
  {
    file: 'src/pages/index.astro',
    sections: [
      'HomeHeroSection',
      'HomeResumeHighlightsSection',
      'HomeRecentProjectsSection',
      'HomeLatestPostsSection',
      'HomeCTASection',
    ],
  },
  {
    file: 'src/pages/about.astro',
    sections: [
      'AboutHeroSection',
      'AboutProofSection',
      'AboutTimelineSection',
      'AboutEducationSkillsSection',
      'CtaBand',
    ],
  },
  {
    file: 'src/pages/projects/index.astro',
    sections: [
      'PageHero',
      'ProjectsFeaturedSection',
      'ProjectsLibrarySection',
      'ProjectsCapabilitiesSection',
      'ProjectsFindingsSection',
      'ProjectsCTASection',
    ],
  },
  {
    file: 'src/pages/blog/index.astro',
    sections: ['BlogIndexHeroSection', 'BlogIndexContentSection'],
  },
  {
    file: 'src/pages/contact.astro',
    sections: ['ContactHeroSection', 'ContactMessageSection', 'ContactChannels'],
  },
];

describe('page composition contract', () => {
  it('keeps main route rhythm delegated to canonical feature sections', () => {
    for (const contract of routeContracts) {
      const source = readFileSync(resolve(root, contract.file), 'utf-8');

      expect(source, `${contract.file} should use the shared layout`).toContain('Layout');
      for (const section of contract.sections) {
        expect(source, `${contract.file} should compose ${section}`).toContain(section);
      }
    }
  });

  it('blocks page-level gutter and section-padding ladders', () => {
    for (const contract of routeContracts) {
      const source = readFileSync(resolve(root, contract.file), 'utf-8');

      expect(source, `${contract.file} should not own horizontal gutters`).not.toMatch(
        /\b(?:px|pl|pr)-\d+(?:\s|["'])/
      );
      expect(source, `${contract.file} should not own raw section padding`).not.toMatch(
        /\bpy-(?:14|16|20|24|28|32)(?:\s|["'])/
      );
      expect(source, `${contract.file} should not use shell escapes`).not.toMatch(
        /-mt-24|-mx-4\s+sm:-mx-6\s+lg:-mx-8/
      );
    }
  });

  it('keeps layout exceptions explicit at their composite owners', () => {
    const pageHero = readFileSync(
      resolve(root, 'src/components/composites/PageHero.astro'),
      'utf-8'
    );
    const ctaBand = readFileSync(resolve(root, 'src/components/composites/CtaBand.astro'), 'utf-8');

    expect(pageHero).toContain('PageHero — page-level hero shell');
    expect(ctaBand).toContain('CtaBand — full-bleed closing CTA');
    expect(pageHero).toContain('py-section-');
    expect(ctaBand).toContain('py-section-');
  });
});
