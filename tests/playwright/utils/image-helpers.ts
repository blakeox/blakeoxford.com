// Image validation and debugging utilities
import { Page } from '@playwright/test';

/**
 * Check and log image loading status for debugging
 */
export async function debugImageLoading(page: Page): Promise<void> {
  console.log('=== Image Loading Debug ===');
  
  const imageStats = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const stats = {
      total: images.length,
      loaded: 0,
      failed: 0,
      lazy: 0,
      loading: 0,
      details: [] as Array<{
        src: string;
        alt: string;
        naturalWidth: number;
        naturalHeight: number;
        complete: boolean;
        loading: string | null;
        hasError: boolean;
      }>
    };
    
    images.forEach(img => {
      const detail = {
        src: img.src,
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
        loading: img.getAttribute('loading'),
        hasError: img.onerror !== null
      };
      
      stats.details.push(detail);
      
      if (detail.naturalWidth > 0) {
        stats.loaded++;
      } else if (detail.loading === 'lazy') {
        stats.lazy++;
      } else if (!detail.complete) {
        stats.loading++;
      } else {
        stats.failed++;
      }
    });
    
    return stats;
  });
  
  console.log(`Images: ${imageStats.total} total, ${imageStats.loaded} loaded, ${imageStats.failed} failed, ${imageStats.lazy} lazy, ${imageStats.loading} loading`);
  
  // Log problematic images
  const problematicImages = imageStats.details.filter(
    img => img.naturalWidth === 0 && !img.loading && img.complete
  );
  
  if (problematicImages.length > 0) {
    console.log('Problematic images:');
    problematicImages.forEach(img => {
      console.log(`  - ${img.src} (alt: "${img.alt}")`);
    });
  }
  
  console.log('=== End Image Debug ===');
}

/**
 * Ensure images are loaded or handled gracefully
 */
export async function ensureImagesReady(page: Page, timeout = 15000): Promise<void> {
  try {
    // First, wait for lazy images to start loading by scrolling
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    
    // Wait briefly for lazy loading to trigger
    await page.waitForTimeout(1000);
    
    // Wait for images to load or timeout gracefully
    await page.waitForFunction(
      () => {
        const images = Array.from(document.querySelectorAll('img'));
        const totalImages = images.length;
        
        if (totalImages === 0) return true;
        
        const readyImages = images.filter(img => {
          // Image is ready if:
          // 1. It has loaded (naturalWidth > 0)
          // 2. It's lazy loading and hasn't started yet
          // 3. It's explicitly marked as decorative
          // 4. It has an error state but won't block rendering
          return (
            img.naturalWidth > 0 ||
            img.getAttribute('loading') === 'lazy' ||
            img.getAttribute('role') === 'presentation' ||
            img.hasAttribute('data-ignore-loading')
          );
        });
        
        const readyRatio = readyImages.length / totalImages;
        
        // Consider page ready if 80% of images are loaded/handled
        return readyRatio >= 0.8;
      },
      { timeout }
    );
    
  } catch {
    console.warn('Image loading timeout - debugging image states...');
    await debugImageLoading(page);
    
    // Don't fail the test, just log the issue
    console.warn('Continuing with test despite image loading issues');
  }
}
