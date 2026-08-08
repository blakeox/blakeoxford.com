import { describe, expect, it } from 'vitest';
import { getLocalImageDimensions } from '@/lib/seo/image-metadata.mjs';

describe('SEO social image metadata', () => {
  it('measures the default social image', async () => {
    await expect(getLocalImageDimensions('/assets/images/og-image.jpg')).resolves.toEqual({
      width: 1200,
      height: 630,
    });
  });

  it('measures a page-specific project image', async () => {
    await expect(getLocalImageDimensions('/assets/projects/adp-automation.png')).resolves.toEqual({
      width: 1400,
      height: 933,
    });
  });

  it('returns null for missing or unsafe assets', async () => {
    await expect(getLocalImageDimensions('/assets/images/not-found.png')).resolves.toBeNull();
    await expect(getLocalImageDimensions('/assets/../secrets.png')).resolves.toBeNull();
    await expect(
      getLocalImageDimensions('https://third-party.example/assets/images/og-image.jpg')
    ).resolves.toBeNull();
  });
});
