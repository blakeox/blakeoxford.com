import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { bindHomeHero, teardownHomeDual } from '../../src/components/features/home/homeHeroDual';

function setup({ reducedMotion = false, hoverFine = true } = {}) {
  const lists = new Map<string, MediaQueryList>();
  const makeList = (matches: boolean) => {
    const media = new EventTarget() as MediaQueryList;
    Object.defineProperty(media, 'matches', { value: matches, writable: true });
    return media;
  };
  lists.set('(prefers-reduced-motion: reduce)', makeList(reducedMotion));
  lists.set('(hover: hover) and (pointer: fine)', makeList(hoverFine));
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const existing = lists.get(query);
    if (existing) return existing;
    const media = makeList(false);
    lists.set(query, media);
    return media;
  });
  document.body.innerHTML = `<section data-home-dual data-side="work">
    <div class="home-dual-frame" tabindex="0"></div>
    <img data-dual-daring loading="lazy" />
    <span data-frame-caption>Work</span>
  </section>`;
  const root = document.querySelector<HTMLElement>('[data-home-dual]')!;
  return { root, media: lists.get('(prefers-reduced-motion: reduce)')! };
}

afterEach(() => {
  teardownHomeDual();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('home hero static layout', () => {
  it('exposes both taglines in the copy column', () => {
    const source = readFileSync('src/components/features/home/HomeHeroCopy.astro', 'utf8');
    expect(source).toContain('data-dual-line-work');
    expect(source).toContain('data-dual-line-daring');
    expect(source).toContain('content.secondaryCta');
    expect(source).not.toContain('aria-live');
  });

  it('loads the second portrait on hover in motion mode', () => {
    const { root } = setup();
    bindHomeHero();
    expect(root.dataset.side).toBe('work');
    root.querySelector('.home-dual-frame')?.dispatchEvent(new Event('pointerenter'));
    expect(root.dataset.side).toBe('daring');
    expect(root.querySelector('[data-frame-caption]')?.textContent).toBe('Daring');
    expect(root.querySelector('img')?.loading).toBe('eager');
  });

  it('toggles the second portrait on tap when hover is unavailable', () => {
    const { root } = setup({ hoverFine: false });
    bindHomeHero();
    const frame = root.querySelector('.home-dual-frame');
    frame?.dispatchEvent(new Event('pointerenter'));
    expect(root.dataset.side).toBe('work');
    frame?.dispatchEvent(new Event('click'));
    expect(root.dataset.side).toBe('daring');
    expect(root.querySelector('[data-frame-caption]')?.textContent).toBe('Daring');
    frame?.dispatchEvent(new Event('click'));
    expect(root.dataset.side).toBe('work');
  });

  it('shows both sides immediately when motion is reduced', () => {
    const { root } = setup({ reducedMotion: true });
    bindHomeHero();
    expect(root.dataset.side).toBe('both');
    expect(root.querySelector('[data-frame-caption]')?.textContent).toBe('Two sides');
    expect(root.querySelector('img')?.loading).toBe('eager');
  });

  it('responds to preference changes and removes its listener on teardown', () => {
    const { root, media } = setup();
    bindHomeHero();
    expect(root.dataset.side).toBe('work');
    Object.defineProperty(media, 'matches', { value: true });
    media.dispatchEvent(new Event('change'));
    expect(root.dataset.side).toBe('both');

    teardownHomeDual();
    Object.defineProperty(media, 'matches', { value: false });
    media.dispatchEvent(new Event('change'));
    expect(root.dataset.side).toBe('both');
    expect(root.dataset.bound).toBeUndefined();
  });
});
