/**
 * Home dual-identity hero — contact prefetch + portrait hover (fine) or tap (coarse).
 * Copy always shows both theses; scroll no longer invents a second viewport.
 */

type DualSide = 'work' | 'daring' | 'both';

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

function bindHomeDual() {
  const root = document.querySelector<HTMLElement>('[data-home-dual]');
  if (!root || root.dataset.bound === 'true') return;

  const frame = root.querySelector<HTMLElement>('.home-dual-frame');
  const daringImg = root.querySelector<HTMLImageElement>('[data-dual-daring]');
  const frameCaption = root.querySelector<HTMLElement>('[data-frame-caption]');
  if (!frame) return;

  root.dataset.bound = 'true';
  teardownHomeDual();
  homeDualAC = new AbortController();
  const { signal } = homeDualAC;

  const staticLayout = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hoverFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  signal.addEventListener('abort', () => delete root.dataset.bound, { once: true });

  let warmed = false;
  const warmDaring = () => {
    if (warmed || !daringImg) return;
    warmed = true;
    if (daringImg.loading === 'lazy') daringImg.loading = 'eager';
  };

  const setSide = (side: DualSide) => {
    root.setAttribute('data-side', side);
    if (!frameCaption) return;
    switch (side) {
      case 'both':
        frameCaption.textContent = 'Two sides';
        break;
      case 'daring':
        frameCaption.textContent = 'Daring';
        break;
      case 'work':
        frameCaption.textContent = 'Work';
        break;
      default: {
        const _exhaustive: never = side;
        return _exhaustive;
      }
    }
  };

  const syncStatic = () => {
    if (staticLayout.matches) {
      setSide('both');
      warmDaring();
      return true;
    }
    return false;
  };

  if (!syncStatic()) setSide('work');

  const onEnter = () => {
    if (syncStatic()) return;
    warmDaring();
    setSide('daring');
  };
  const onLeave = () => {
    if (syncStatic()) return;
    setSide('work');
  };
  const onToggle = () => {
    if (syncStatic()) return;
    warmDaring();
    setSide(root.getAttribute('data-side') === 'daring' ? 'work' : 'daring');
  };

  frame.addEventListener(
    'pointerenter',
    () => {
      if (!hoverFine.matches) return;
      onEnter();
    },
    { signal }
  );
  frame.addEventListener(
    'pointerleave',
    () => {
      if (!hoverFine.matches) return;
      onLeave();
    },
    { signal }
  );
  frame.addEventListener(
    'click',
    () => {
      if (hoverFine.matches) return;
      onToggle();
    },
    { signal }
  );
  frame.addEventListener('focus', onEnter, { signal });
  frame.addEventListener('blur', onLeave, { signal });
  staticLayout.addEventListener(
    'change',
    () => {
      if (!syncStatic()) setSide('work');
    },
    { signal }
  );
}

export function bindHomeHero() {
  bindContactPrefetch();
  bindHomeDual();
}
