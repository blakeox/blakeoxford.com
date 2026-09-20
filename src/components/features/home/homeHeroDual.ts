/**
 * Home dual-identity hero — one dissolve, then rest.
 * Work holds, then Daring; scrolling the portrait away can play that reveal early.
 */

export const HOME_DUAL_INTRO_MS = 1800;

type DualSide = 'work' | 'daring' | 'both';
type DualChoice = Exclude<DualSide, 'both'>;

function bindContactPrefetch() {
  const cta = document.querySelector<HTMLAnchorElement>('[data-prefetch-contact]');
  if (!cta || cta.dataset.prefetchBound === 'true') return;
  cta.dataset.prefetchBound = 'true';

  const href = cta.getAttribute('href');
  if (!href) return;

  const prefetch = () => {
    if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  };

  cta.addEventListener('pointerenter', prefetch, { once: true });
  cta.addEventListener('focus', prefetch, { once: true });
}

let homeDualAC: AbortController | null = null;

export function teardownHomeDual() {
  homeDualAC?.abort();
  homeDualAC = null;
}

function readChoice(value: string | null): DualChoice | null {
  if (value === 'work' || value === 'daring') return value;
  return null;
}

function bindHomeDual() {
  const root = document.querySelector<HTMLElement>('[data-home-dual]');
  if (!root || root.dataset.bound === 'true') return;

  const daringImg = root.querySelector<HTMLImageElement>('[data-dual-daring]');
  const selects = root.querySelectorAll<HTMLElement>('[data-dual-select]');
  if (selects.length === 0) return;

  root.dataset.bound = 'true';
  teardownHomeDual();
  homeDualAC = new AbortController();
  const { signal } = homeDualAC;

  const staticLayout = window.matchMedia('(prefers-reduced-motion: reduce)');
  signal.addEventListener('abort', () => delete root.dataset.bound, { once: true });

  let warmed = false;
  const warmDaring = () => {
    if (warmed || !daringImg) return;
    warmed = true;
    if (daringImg.loading === 'lazy') daringImg.loading = 'eager';
  };

  const isPressed = (side: DualSide, choice: DualChoice): boolean => {
    switch (side) {
      case 'both':
        return true;
      case 'work':
        return choice === 'work';
      case 'daring':
        return choice === 'daring';
      default: {
        const _exhaustive: never = side;
        return _exhaustive;
      }
    }
  };

  const setSide = (side: DualSide) => {
    root.setAttribute('data-side', side);
    for (const el of selects) {
      const choice = readChoice(el.getAttribute('data-dual-select'));
      if (!choice) continue;
      el.setAttribute('aria-pressed', isPressed(side, choice) ? 'true' : 'false');
    }
  };

  let introTimer = 0;
  let revealed = false;
  let manual = false;

  const clearIntro = () => {
    window.clearTimeout(introTimer);
    introTimer = 0;
  };

  signal.addEventListener('abort', clearIntro, { once: true });

  const revealDaring = () => {
    if (revealed || manual || staticLayout.matches) return;
    revealed = true;
    clearIntro();
    warmDaring();
    setSide('daring');
  };

  const queueReveal = () => {
    clearIntro();
    if (revealed || manual || staticLayout.matches || document.visibilityState === 'hidden') {
      return;
    }
    introTimer = window.setTimeout(() => {
      introTimer = 0;
      if (signal.aborted) return;
      revealDaring();
    }, HOME_DUAL_INTRO_MS);
  };

  const readScrolledAway = () => {
    const visual = root.querySelector<HTMLElement>('.home-dual-visual') ?? root;
    const rect = visual.getBoundingClientRect();
    const threshold = Math.max(64, rect.height * 0.16);
    return rect.top < -threshold;
  };

  const syncScroll = () => {
    if (staticLayout.matches || manual) return;
    if (readScrolledAway()) revealDaring();
  };

  const syncStatic = () => {
    if (staticLayout.matches) {
      clearIntro();
      revealed = true;
      manual = false;
      setSide('both');
      warmDaring();
      return true;
    }
    return false;
  };

  if (!syncStatic()) {
    setSide('work');
    warmDaring();
    queueReveal();
  }

  const choose = (side: DualChoice) => {
    manual = true;
    revealed = true;
    clearIntro();
    warmDaring();
    setSide(side);
  };

  for (const el of selects) {
    el.addEventListener(
      'click',
      () => {
        const choice = readChoice(el.getAttribute('data-dual-select'));
        if (!choice) return;
        choose(choice);
      },
      { signal }
    );
  }

  window.addEventListener('scroll', syncScroll, { signal, passive: true });
  window.addEventListener('resize', syncScroll, { signal });
  document.addEventListener(
    'visibilitychange',
    () => {
      if (staticLayout.matches) return;
      if (document.visibilityState === 'hidden') {
        clearIntro();
        return;
      }
      queueReveal();
    },
    { signal }
  );
  staticLayout.addEventListener(
    'change',
    () => {
      if (syncStatic()) return;
      revealed = false;
      manual = false;
      setSide('work');
      queueReveal();
    },
    { signal }
  );
}

export function bindHomeHero() {
  bindContactPrefetch();
  bindHomeDual();
}
