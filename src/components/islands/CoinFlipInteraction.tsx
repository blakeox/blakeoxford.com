import { useEffect } from 'react';

interface Props {
  rootId: string;
  liveRegionId: string;
  flipOnClick: boolean;
}

/**
 * Toggles `data-flipped` / `aria-pressed` on the coin button.
 * Transform is CSS-driven — do not set inline transform here.
 * Native `<button>` already activates on Enter/Space; no extra keydown handler.
 */
export default function CoinFlipInteraction({ rootId, liveRegionId, flipOnClick }: Props) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    const liveRegion = document.getElementById(liveRegionId);
    if (!root || !liveRegion) return;

    const announce = (message: string) => {
      liveRegion.textContent = message;
      window.setTimeout(() => {
        liveRegion.textContent = '';
      }, 750);
    };

    const handleClick = () => {
      if (!flipOnClick) return;
      const next = root.getAttribute('data-flipped') !== 'true';
      root.setAttribute('data-flipped', next ? 'true' : 'false');
      root.setAttribute('aria-pressed', next ? 'true' : 'false');
      announce(next ? 'Showing reverse side.' : 'Showing front side.');
    };

    root.addEventListener('click', handleClick);
    return () => {
      root.removeEventListener('click', handleClick);
    };
  }, [rootId, liveRegionId, flipOnClick]);

  return null;
}
