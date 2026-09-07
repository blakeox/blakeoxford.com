import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { bindHomeHero, teardownHomeDual } from '../../src/components/features/home/homeHeroDual';

const staticQuery = '(prefers-reduced-motion: reduce), (max-height: 700px)';

function setup(matches: boolean) {
  const media = new EventTarget() as MediaQueryList;
  Object.defineProperty(media, 'matches', { value: matches, writable: true });
  vi.spyOn(window, 'matchMedia').mockReturnValue(media);
  document.body.innerHTML = `<section data-home-dual>
    <div class="home-dual-track"><div class="home-dual-sticky"></div></div>
    <img data-dual-daring loading="lazy" />
    <span data-frame-caption>Work</span>
  </section>`;
  const root = document.querySelector<HTMLElement>('[data-home-dual]')!;
  return { root, media };
}

afterEach(() => {
  teardownHomeDual();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('home hero static layout', () => {
  it('exposes both taglines without scroll-triggered live announcements', () => {
    const source = readFileSync('src/components/features/home/HomeHeroCopy.astro', 'utf8');
    expect(source).toContain('<p class="sr-only">{workLine} {daringLine}</p>');
    expect(source).not.toContain('aria-live');
    expect(source).not.toContain('data-dual-live');
  });

  it('shares the short-viewport and reduced-motion query with CSS', () => {
    setup(true);
    bindHomeHero();
    expect(window.matchMedia).toHaveBeenCalledWith(staticQuery);
    const css = readFileSync('src/components/features/home/home-hero-dual.css', 'utf8');
    expect(css).toContain(`@media ${staticQuery}`);
  });

  it('shows both sides immediately and loads the second portrait in static mode', () => {
    const { root } = setup(true);
    bindHomeHero();
    expect(root.dataset.side).toBe('both');
    expect(root.dataset.settled).toBe('false');
    expect(root.querySelector('[data-frame-caption]')?.textContent).toBe('Two sides');
    expect(root.querySelector('img')?.loading).toBe('eager');
  });

  it('responds to preference changes and removes its listener on teardown', () => {
    const { root, media } = setup(false);
    bindHomeHero();
    expect(root.dataset.side).toBe('work');
    Object.defineProperty(media, 'matches', { value: true });
    media.dispatchEvent(new Event('change'));
    expect(root.dataset.side).toBe('both');
    expect(root.style.getPropertyValue('--dual-progress')).toBe('0');

    teardownHomeDual();
    Object.defineProperty(media, 'matches', { value: false });
    media.dispatchEvent(new Event('change'));
    expect(root.dataset.side).toBe('both');
    expect(root.dataset.bound).toBeUndefined();

    bindHomeHero();
    expect(root.dataset.side).toBe('work');
  });
});
