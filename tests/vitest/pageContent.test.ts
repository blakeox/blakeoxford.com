import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('About and Contact page content', () => {
  it('about page.json includes required sections', () => {
    const about = JSON.parse(
      readFileSync(path.join(process.cwd(), 'src/content/about/page.json'), 'utf8'),
    );

    expect(about.meta.title).toBeTruthy();
    expect(about.hero.proofPoints.length).toBeGreaterThan(0);
    expect(about.achievements.cards.length).toBe(3);
    expect(about.timeline.items.length).toBeGreaterThan(0);
    expect(about.education.skills.length).toBeGreaterThan(0);
  });

  it('contact page.json includes channels and hero CTAs', () => {
    const contact = JSON.parse(
      readFileSync(path.join(process.cwd(), 'src/content/contact/page.json'), 'utf8'),
    );

    expect(contact.meta.title).toBeTruthy();
    expect(contact.hero.scenarios.length).toBe(3);
    expect(contact.channels.items.length).toBeGreaterThan(0);
    expect(contact.channels.items.some((item: { icon: string }) => item.icon === 'email')).toBe(true);
  });
});
