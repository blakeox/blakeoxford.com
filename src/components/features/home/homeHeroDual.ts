/**
 * Home dual-identity hero — scroll scrub, reduced-motion, CTA prefetch.
 */

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

  const track = root.querySelector<HTMLElement>('.home-dual-track');
  const sticky = root.querySelector<HTMLElement>('.home-dual-sticky');
  const live = root.querySelector<HTMLElement>('[data-dual-live]');
  const daringImg = root.querySelector<HTMLImageElement>('[data-dual-daring]');
  const frameCaption = root.querySelector<HTMLElement>('[data-frame-caption]');
  if (!track) return;

  root.dataset.bound = 'true';
  teardownHomeDual();
  homeDualAC = new AbortController();
  const { signal } = homeDualAC;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.style.setProperty('--dual-progress', '0');
    root.setAttribute('data-side', 'both');
    root.setAttribute('data-hint', 'off');
    root.setAttribute('data-settled', 'false');
    if (frameCaption) frameCaption.textContent = 'Two sides';
    return;
  }

  let lastSide = 'work';
  let warmed = false;
  /** Fraction of track travel used for the Work→Daring scrub; remainder is settle. */
  const SCRUB_END = 0.8;

  const warmDaring = () => {
    if (warmed || !daringImg) return;
    warmed = true;
    if (daringImg.loading === 'lazy') daringImg.loading = 'eager';
  };

  const update = () => {
    const rect = track.getBoundingClientRect();
    const view = sticky?.getBoundingClientRect().height || window.innerHeight || 1;
    const total = Math.max(1, rect.height - view);
    const raw = Math.min(1, Math.max(0, -rect.top / total));
    const settled = raw >= SCRUB_END;
    const progress = settled ? 1 : raw / SCRUB_END;

    root.style.setProperty('--dual-progress', progress.toFixed(4));
    root.setAttribute('data-hint', progress > 0.12 ? 'off' : 'on');
    root.setAttribute('data-settled', settled ? 'true' : 'false');

    if (progress > 0.08) warmDaring();

    const side = progress >= 0.5 ? 'daring' : 'work';
    root.setAttribute('data-side', side);
    if (frameCaption) {
      frameCaption.textContent = settled || side === 'daring' ? 'Daring' : 'Work';
    }
    if (side !== lastSide && live) {
      const message = side === 'daring' ? 'Daring side' : 'Work side';
      live.textContent = message;
      lastSide = side;
      window.setTimeout(() => {
        if (live.textContent === message) live.textContent = '';
      }, 800);
    }
  };

  update();
  window.addEventListener('scroll', update, { passive: true, signal });
  window.addEventListener('resize', update, { signal });
}

export function bindHomeHero() {
  bindContactPrefetch();
  bindHomeDual();
}
