 
import { test, expect } from '@playwright/test';
import { waitForIdle, waitForCondition } from '../utils/waits';

interface ConsoleMessage {
  type: string;
  text: string;
  location: { url: string; lineNumber: number; columnNumber: number; };
}

test.describe('SearchOverlay Comprehensive Diagnostics', () => {
  test('should diagnose all SearchOverlay issues comprehensively', async ({ page }) => {
    // Navigate to the homepage
  await page.goto('/');
  await waitForIdle(page);

    console.log('🔍 Starting comprehensive SearchOverlay diagnostics...');

    // 1. Check if SearchOverlay HTML element exists
    const overlayExists = await page.evaluate(() => {
      const overlay = document.getElementById('search-overlay');
      return {
        exists: !!overlay,
        classes: overlay?.className || null,
        style: overlay ? {
          opacity: window.getComputedStyle(overlay).opacity,
          visibility: window.getComputedStyle(overlay).visibility,
          display: window.getComputedStyle(overlay).display,
          position: window.getComputedStyle(overlay).position,
          zIndex: window.getComputedStyle(overlay).zIndex
        } : null
      };
    });

    console.log('1. Overlay HTML Element:', overlayExists);
    expect(overlayExists.exists).toBe(true);

    // 2. Check if all child elements exist
    const childElements = await page.evaluate(() => {
      return {
        searchInput: !!document.getElementById('search-input'),
        searchResults: !!document.getElementById('search-results'),
        closeButton: !!document.getElementById('close-search'),
        backdrop: !!document.querySelector('.search-backdrop')
      };
    });

    console.log('2. Child Elements:', childElements);
    expect(childElements.searchInput).toBe(true);
    expect(childElements.searchResults).toBe(true);

    // 3. Check script loading
    const scriptLoading = await page.evaluate(() => {
      const scriptElements = Array.from(document.scripts);
      const scripts = scriptElements.map(script => ({
        src: script.src,
        loaded: !script.hasAttribute('data-error')
      }));

      return {
        allScripts: scripts,
        interactive: scripts.find(s => s.src.includes('interactive')),
        hasErrors: scriptElements.some(s => s.hasAttribute('data-error'))
      };
    });

    console.log('3. Script Loading:', scriptLoading);

    // 4. Check window objects and JavaScript state
    const jsState = await page.evaluate(() => {
      const win = window as any;
      return {
        searchOverlay: typeof win.searchOverlay,
        searchOverlayInstance: !!win.searchOverlay,
        fuseJS: typeof win.Fuse,
        searchOverlayConstructor: typeof win.SearchOverlay,
        errorLog: window.console ? 'available' : 'not available'
      };
    });

    console.log('4. JavaScript State:', jsState);

    // 5. Check console errors
    const consoleMessages: ConsoleMessage[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()
        });
      }
    });

  // Allow client bundles to register search overlay instance
  await waitForCondition(page, () => page.evaluate(() => !!(window as any).searchOverlay), 2000, 100);

    // 6. Try to trigger search overlay via JavaScript
    const jsActivation = await page.evaluate(() => {
      try {
        const win = window as any;
        if (win.searchOverlay && typeof win.searchOverlay.open === 'function') {
          win.searchOverlay.open();
          return { success: true, error: null };
        } else {
          return { success: false, error: 'SearchOverlay instance or open method not found' };
        }
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    console.log('6. JavaScript Activation:', jsActivation);

    // 7. Check if overlay becomes visible after JS activation
    const visibilityAfterJS = await page.evaluate(() => {
      const overlay = document.getElementById('search-overlay');
      if (!overlay) return null;

      const computed = window.getComputedStyle(overlay);
      return {
        opacity: computed.opacity,
        visibility: computed.visibility,
        display: computed.display,
        hasActiveClass: overlay.classList.contains('active')
      };
    });

    console.log('7. Visibility After JS:', visibilityAfterJS);

    // 8. Try keyboard shortcut activation
  await page.keyboard.press('Control+k');
  // Wait for overlay to become active if possible
  await page.waitForSelector('[data-search-result], .search-result', { timeout: 4000 });

    const visibilityAfterKeyboard = await page.evaluate(() => {
      const overlay = document.getElementById('search-overlay');
      if (!overlay) return null;

      const computed = window.getComputedStyle(overlay);
      return {
        opacity: computed.opacity,
        visibility: computed.visibility,
        display: computed.display,
        hasActiveClass: overlay.classList.contains('active')
      };
    });

    console.log('8. Visibility After Keyboard:', visibilityAfterKeyboard);

    // 9. Force activation via CSS manipulation
    const forceActivation = await page.evaluate(() => {
      const overlay = document.getElementById('search-overlay');
      if (!overlay) return false;

      // Add active class
      overlay.classList.add('active');

      // Force styles
      overlay.style.opacity = '1';
      overlay.style.visibility = 'visible';
      overlay.style.display = 'flex';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '9999';

      const computed = window.getComputedStyle(overlay);
      return {
        forced: true,
        opacity: computed.opacity,
        visibility: computed.visibility,
        display: computed.display,
        hasActiveClass: overlay.classList.contains('active')
      };
    });

    console.log('9. Force Activation:', forceActivation);

    // 10. Check if SearchOverlay constructor exists but instance doesn't
    const constructorCheck = await page.evaluate(() => {
      const win = window as any;
      // Check if SearchOverlay class exists in global scope
      if (typeof win.SearchOverlay !== 'undefined') {
        try {
          // Try to create an instance manually
          const testInstance = new win.SearchOverlay();
          return {
            constructorExists: true,
            canInstantiate: true,
            instanceType: typeof testInstance,
            hasOpenMethod: typeof testInstance.open === 'function'
          };
        } catch (error: any) {
          return {
            constructorExists: true,
            canInstantiate: false,
            error: error.message
          };
        }
      } else {
        return {
          constructorExists: false,
          error: 'SearchOverlay constructor not found in global scope'
        };
      }
    });

    console.log('10. Constructor Check:', constructorCheck);

    // 11. Check bundle contents
    const bundleCheck = await page.evaluate(async () => {
      try {
        const response = await fetch('/assets/js/interactive.min.js');
        const content = await response.text();

        return {
          bundleExists: response.ok,
          bundleSize: content.length,
          containsSearchOverlay: content.includes('SearchOverlay'),
          containsConstructor: content.includes('constructor'),
          containsOpen: content.includes('open'),
          containsInit: content.includes('init'),
          firstHundredChars: content.substring(0, 100)
        };
      } catch (error: any) {
        return {
          bundleExists: false,
          error: error.message
        };
      }
    });

    console.log('11. Bundle Check:', bundleCheck);

    // 12. Check for initialization code
    const initCheck = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script');
      let hasInitCode = false;
      const initPatterns: string[] = [];

      scripts.forEach(script => {
        if (script.textContent) {
          if (script.textContent.includes('searchOverlay') ||
              script.textContent.includes('SearchOverlay')) {
            hasInitCode = true;
            initPatterns.push(script.textContent.substring(0, 200));
          }
        }
      });

      return {
        hasInitCode,
        initPatterns,
        totalScripts: scripts.length
      };
    });

    console.log('12. Initialization Check:', initCheck);

    console.log('🏁 Diagnostic complete!');
    console.log('Console Messages:', consoleMessages);

    // If SearchOverlay is not working, try to manually load and initialize it
    if (!jsState.searchOverlayInstance) {
      console.log('⚠️ Search overlay failed to initialize automatically.');
    }
  });
});
