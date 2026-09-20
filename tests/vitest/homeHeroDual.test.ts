import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  bindHomeHero,
  HOME_DUAL_INTRO_MS,
  teardownHomeDual,
} from '../../src/components/features/home/homeHeroDual';

function box(top: number, height = 800): DOMRect {
  return {
    top,
    height,
    bottom: top + height,
    left: 0,
    right: 1200,
    width: 1200,
    x: 0,
    y: top,
    toJSON() {
      return {};
    },
  } as DOMRect;
}

function setup({ reducedMotion = false } = {}) {
  const lists = new Map<string, MediaQueryList>();
  const makeList = (matches: boolean) => {
    const media = new EventTarget() as MediaQueryList;
    Object.defineProperty(media, 'matches', { value: matches, writable: true });
    return media;
  };
  lists.set('(prefers-reduced-motion: reduce)', makeList(reducedMotion));
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const existing = lists.get(query);
    if (existing) return existing;
    const media = makeList(false);
    lists.set(query, media);
    return media;
  });
  document.body.innerHTML = `<section data-home-dual data-side="work">
    <div class="home-dual-visual">
      <button data-dual-select="work" data-dual-line-work aria-pressed="true">Work line</button>
      <button data-dual-select="daring" data-dual-line-daring aria-pressed="false">Daring line</button>
      <button data-dual-select="work" aria-pressed="true">Work</button>
      <button data-dual-select="daring" aria-pressed="false">Daring</button>
      <img data-dual-daring loading="lazy" />
    </div>
  </section>`;
  const root = document.querySelector<HTMLElement>('[data-home-dual]')!;
  const visual = root.querySelector<HTMLElement>('.home-dual-visual')!;
  vi.spyOn(visual, 'getBoundingClientRect').mockReturnValue(box(0));
  return { root, visual, media: lists.get('(prefers-reduced-motion: reduce)')! };
}

afterEach(() => {
  teardownHomeDual();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('home hero static layout', () => {
  it('exposes both taglines as labeled switches in the copy column', () => {
    const source = readFileSync('src/components/features/home/HomeHeroCopy.astro', 'utf8');
    expect(source).toContain('data-dual-line-work');
    expect(source).toContain('data-dual-line-daring');
    expect(source).toContain('data-dual-select="work"');
    expect(source).toContain('data-dual-select="daring"');
    expect(source).toContain('content.secondaryCta');
    expect(source).not.toContain('aria-live');
  });

  it('keeps the portrait as a flush plane, not a guttered wallet frame', () => {
    const section = readFileSync('src/components/features/home/HomeHeroSection.astro', 'utf8');
    const visual = readFileSync('src/components/features/home/HomeHeroVisual.astro', 'utf8');
    expect(section).toContain('home-dual-copy-shell');
    expect(section).toContain('layout-gutter');
    expect(section).not.toMatch(/home-dual-stage layout-gutter/);
    expect(visual).not.toContain('rounded-xl');
    expect(visual).toContain('home-dual-ask-pad');
    expect(visual).toContain('data-chat-avoid-launcher');
    expect(visual).toMatch(/home-dual-ask-pad[^>]*md:hidden[^>]*data-chat-avoid-launcher/);
    expect(visual).not.toMatch(/home-dual-visual[^>]*data-chat-avoid-launcher/);
    expect(visual).toContain('home-dual-veil');
    expect(visual).toContain('home-dual-switch');
    expect(visual).toContain('blake_detroit_skyline_bell_isle');
    expect(visual).toContain('china-profile-picture-hero');
    expect(visual).not.toContain('Hover or tap');
  });

  it('dissolves to Daring once after the intro hold, then rests', () => {
    vi.useFakeTimers();
    const { root } = setup();
    bindHomeHero();
    expect(root.dataset.side).toBe('work');
    expect(root.querySelector('img')?.loading).toBe('eager');
    vi.advanceTimersByTime(HOME_DUAL_INTRO_MS - 1);
    expect(root.dataset.side).toBe('work');
    vi.advanceTimersByTime(1);
    expect(root.dataset.side).toBe('daring');
    expect(root.querySelector('[data-dual-select="daring"]')?.getAttribute('aria-pressed')).toBe(
      'true'
    );
    vi.advanceTimersByTime(HOME_DUAL_INTRO_MS * 4);
    expect(root.dataset.side).toBe('daring');
  });

  it('lets a labeled choice keep the portrait still', () => {
    vi.useFakeTimers();
    const { root } = setup();
    bindHomeHero();
    root.querySelector('[data-dual-select="work"]')?.dispatchEvent(new Event('click'));
    vi.advanceTimersByTime(HOME_DUAL_INTRO_MS * 2);
    expect(root.dataset.side).toBe('work');
    root.querySelector('[data-dual-select="daring"]')?.dispatchEvent(new Event('click'));
    vi.advanceTimersByTime(HOME_DUAL_INTRO_MS * 2);
    expect(root.dataset.side).toBe('daring');
  });

  it('does not lock a side when a Work/Daring control only receives focus', () => {
    vi.useFakeTimers();
    const { root } = setup();
    bindHomeHero();
    root.querySelector('[data-dual-select="daring"]')?.dispatchEvent(new Event('focus'));
    expect(root.dataset.side).toBe('work');
    vi.advanceTimersByTime(HOME_DUAL_INTRO_MS);
    expect(root.dataset.side).toBe('daring');
  });

  it('commits Daring as the portrait scrolls away and does not rewind', () => {
    vi.useFakeTimers();
    const { root, visual } = setup();
    bindHomeHero();
    vi.mocked(visual.getBoundingClientRect).mockReturnValue(box(-200));
    window.dispatchEvent(new Event('scroll'));
    expect(root.dataset.side).toBe('daring');

    vi.mocked(visual.getBoundingClientRect).mockReturnValue(box(0));
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(HOME_DUAL_INTRO_MS * 2);
    expect(root.dataset.side).toBe('daring');
  });

  it('shows both sides immediately when motion is reduced', () => {
    vi.useFakeTimers();
    const { root } = setup({ reducedMotion: true });
    bindHomeHero();
    expect(root.dataset.side).toBe('both');
    expect(root.querySelector('[data-dual-select="work"]')?.getAttribute('aria-pressed')).toBe(
      'true'
    );
    expect(root.querySelector('[data-dual-select="daring"]')?.getAttribute('aria-pressed')).toBe(
      'true'
    );
    vi.advanceTimersByTime(HOME_DUAL_INTRO_MS * 2);
    expect(root.dataset.side).toBe('both');
  });

  it('responds to preference changes and removes its listener on teardown', () => {
    vi.useFakeTimers();
    const { root, media } = setup();
    bindHomeHero();
    expect(root.dataset.side).toBe('work');
    Object.defineProperty(media, 'matches', { value: true });
    media.dispatchEvent(new Event('change'));
    expect(root.dataset.side).toBe('both');

    teardownHomeDual();
    vi.advanceTimersByTime(HOME_DUAL_INTRO_MS * 2);
    expect(root.dataset.side).toBe('both');
    expect(root.dataset.bound).toBeUndefined();
  });
});
