import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('About, Contact, and Home page content', () => {
  it('about page.json includes required sections', () => {
    const about = JSON.parse(
      readFileSync(path.join(process.cwd(), 'src/content/about/page.json'), 'utf8')
    );

    expect(about.meta.title).toBeTruthy();
    expect(about.hero.proofPoints.length).toBeGreaterThan(0);
    expect(about.achievements.cards.length).toBe(3);
    expect(about.timeline.items.length).toBeGreaterThan(0);
    expect(about.education.skills.length).toBeGreaterThan(0);

    const recap = JSON.stringify(about.achievements) + JSON.stringify(about.timeline);
    expect(recap).not.toMatch(/180/);
    expect(recap).not.toMatch(/\$1\.2M/);
    expect(recap).not.toMatch(/Google Workspace/);
    expect(JSON.stringify(about.hero.proofPoints)).not.toMatch(/Platform migrations/);
    expect(about.hero.description.split(/(?<=[.!?])\s+/).filter(Boolean).length).toBeLessThanOrEqual(
      2
    );
  });

  it('keeps about operating habits in the hero copy, not a second recap band', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/features/about/AboutHeroSection.astro'),
      'utf8'
    );

    expect(source).toContain('content.proofPoints');
    expect(source).toContain('How I show up in engagements');
    expect(source).not.toContain('bg-surface-subtle');
  });

  it('contact page.json includes channels and a bottleneck claim', () => {
    const contact = JSON.parse(
      readFileSync(path.join(process.cwd(), 'src/content/contact/page.json'), 'utf8')
    );

    expect(contact.meta.title).toBeTruthy();
    expect(contact.hero.title).toMatch(/bottleneck/i);
    expect(contact.hero.scenarios.length).toBe(3);
    expect(contact.hero.primaryCta).toBeUndefined();
    expect(contact.hero.secondaryCta).toBeUndefined();
    expect(contact.channels.items.length).toBeGreaterThan(0);
    expect(contact.channels.items.some((item: { icon: string }) => item.icon === 'email')).toBe(
      true
    );
  });

  it('home page.json includes hero, highlights, and section copy', () => {
    const home = JSON.parse(
      readFileSync(path.join(process.cwd(), 'src/content/home/page.json'), 'utf8')
    );

    expect(home.meta.title).toBeTruthy();
    expect(home.hero.defaultTagline).toBeTruthy();
    expect(home.resumeHighlights.sides.length).toBe(2);
    expect(home.resumeHighlights.sides.map((s: { side: string }) => s.side)).toEqual([
      'work',
      'daring',
    ]);
    expect(
      home.resumeHighlights.sides.every(
        (side: { metric: string; items: unknown[] }) =>
          Boolean(side.metric) &&
          side.metric.trim().split(/\s+/).length <= 4 &&
          side.items.length === 3
      )
    ).toBe(true);
    expect(home.recentProjects.cta.href).toBe('/projects/');
    expect(home.cta.button.href).toBe('/contact/');
    expect(home.cta.button.label).toBe('Discuss your bottleneck');
    expect(home.cta.description).toMatch(/constraint/i);
    expect(home.latestPosts.kicker).toBeUndefined();
    expect(home.cta.kicker).toBeUndefined();
  });

  it('keeps page headlines short enough for the type', () => {
    const projects = JSON.parse(
      readFileSync(path.join(process.cwd(), 'src/content/projects/_meta.json'), 'utf8')
    );
    expect(projects.hero.title.trim().split(/\s+/).length).toBeLessThanOrEqual(4);
  });

  it('describes contact entry points as inquiries rather than confirmed bookings', () => {
    const files = [
      'src/content/projects/_meta.json',
      'src/pages/about.astro',
      'src/components/composites/CTASection.astro',
    ];
    for (const file of files) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8');
      expect(source).toContain('Discuss your bottleneck');
      expect(source).not.toContain('Book a 20-minute bottleneck review');
    }
  });
});
