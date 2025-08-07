import { test } from '@playwright/test';

test.describe('Keyboard Navigation Debug', () => {
  test('debug modal dialogs', async ({ page }) => {
    // Set mobile viewport to make mobile menu visible
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for mobile menu button
    const mobileMenuButton = page.locator('button[aria-label*="menu"], .mobile-menu-toggle, #nav-toggle, .burger-menu-button').first();
    console.log(`Mobile menu button visible: ${await mobileMenuButton.isVisible()}`);
    
    if (await mobileMenuButton.isVisible()) {
      console.log('Clicking mobile menu button...');
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);
      
      // Check all possible dialog selectors
      const allDialogs = await page.locator('[role="dialog"]').all();
      console.log(`Found ${allDialogs.length} elements with role="dialog"`);
      
      for (let i = 0; i < allDialogs.length; i++) {
        const dialog = allDialogs[i];
        const isVisible = await dialog.isVisible();
        const classes = await dialog.getAttribute('class');
        const id = await dialog.getAttribute('id');
        console.log(`Dialog ${i + 1}: visible=${isVisible}, id="${id}", classes="${classes}"`);
      }
      
      const mobileMenu = page.locator('[role="dialog"], .mobile-menu').first();
      const isVisible = await mobileMenu.isVisible();
      console.log(`Mobile menu visible after click: ${isVisible}`);
      
      // Check if modernNavBar instance exists
      const navBarExists = await page.evaluate(() => {
        return typeof (window as any).modernNavBar !== 'undefined';
      });
      console.log(`ModernNavBar instance exists: ${navBarExists}`);
      
      if (isVisible) {
        console.log('Pressing Escape...');
        await page.keyboard.press('Escape');
        
        // Check console messages for debug info
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        
        await page.waitForTimeout(500); // Wait for immediate response
        
        let stillVisible = await mobileMenu.isVisible();
        console.log(`Mobile menu visible after 0.5s: ${stillVisible}`);
        
        await page.waitForTimeout(1500); // Wait longer for setTimeout
        
        stillVisible = await mobileMenu.isVisible();
        console.log(`Mobile menu visible after 2s total: ${stillVisible}`);
        
        // Check if it has 'active' class
        const hasActiveClass = await mobileMenu.evaluate(el => el.classList.contains('active'));
        console.log(`Mobile menu has 'active' class: ${hasActiveClass}`);
        
        // Check computed styles
        const computedStyles = await mobileMenu.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            right: styles.right,
            visibility: styles.visibility,
            display: styles.display,
            transform: styles.transform
          };
        });
        console.log('Computed styles after Escape:', computedStyles);
        
        // Check inline style
        const inlineVisibility = await mobileMenu.evaluate(el => el.style.visibility);
        console.log(`Inline visibility style: "${inlineVisibility}"`);
      }
    }
  });
});
