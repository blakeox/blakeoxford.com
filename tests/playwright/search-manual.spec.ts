 
import { test } from '@playwright/test';
import { waitForKeyboardResponse } from './utils/test-helpers';

test.describe('SearchOverlay Manual Test', () => {
  test('should manually create and test SearchOverlay', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('🧪 Starting manual SearchOverlay test...');
    
    // Check if SearchOverlay class exists and try to instantiate it manually
    const manualTest = await page.evaluate(() => {
      try {
        console.log('Trying to create SearchOverlay manually...');
        
        // Check if the class exists in global scope
        if (typeof SearchOverlay !== 'undefined') {
          console.log('SearchOverlay class found!');
          const instance = new SearchOverlay();
          window.testSearchOverlay = instance;
          return {
            success: true,
            classExists: true,
            canInstantiate: true,
            instance: !!window.testSearchOverlay
          };
        } else {
          console.log('SearchOverlay class not found in global scope');
          return {
            success: false,
            classExists: false,
            error: 'SearchOverlay class not in global scope'
          };
        }
      } catch (error: any) {
        console.error('Error creating SearchOverlay:', error);
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log('Manual Test Result:', manualTest);
    
    if (manualTest.success) {
      // Test the search overlay functionality
      const functionalTest = await page.evaluate(() => {
        try {
          const testInstance = (window as any).testSearchOverlay;
          if (testInstance && typeof testInstance.open === 'function') {
            testInstance.open();
            
            const overlay = document.getElementById('search-overlay');
            return {
              opened: true,
              overlayHasActiveClass: overlay?.classList.contains('active'),
              overlayVisible: overlay ? window.getComputedStyle(overlay).opacity === '1' : false
            };
          } else {
            return {
              opened: false,
              error: 'testSearchOverlay instance or open method not found'
            };
          }
        } catch (error: any) {
          return {
            opened: false,
            error: error.message
          };
        }
      });
      
      console.log('Functional Test Result:', functionalTest);
      
      // If it worked, test keyboard shortcut
      if (functionalTest.opened) {
        await page.keyboard.press('Escape'); // Close it first
        await waitForKeyboardResponse(page);
        
        await page.keyboard.press('Control+k'); // Try to open with shortcut
        await waitForKeyboardResponse(page);
        
        const keyboardTest = await page.evaluate(() => {
          const overlay = document.getElementById('search-overlay');
          return {
            overlayHasActiveClass: overlay?.classList.contains('active'),
            overlayVisible: overlay ? window.getComputedStyle(overlay).opacity === '1' : false
          };
        });
        
        console.log('Keyboard Test Result:', keyboardTest);
      }
    }
    
    // Check console messages for any errors
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning' || msg.text().includes('SearchOverlay')) {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    
    console.log('Console Messages:', consoleMessages);
  });
});
