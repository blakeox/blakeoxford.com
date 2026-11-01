import { getImage } from 'astro:assets';
import portrait from '@/assets/images/carousel/blake_detroit_skyline_bell_isle.webp';

// Keep the preload and img candidates identical so the browser downloads one hero image.
export const homePortraitSizes = '(width > 80rem) 43.2rem, (width > 64rem) 54vw, 100vw';

export function getHomePortrait() {
  return getImage({
    src: portrait,
    width: portrait.width,
    widths: [320, 480, 640, portrait.width],
    format: 'avif',
    quality: 70,
  });
}
