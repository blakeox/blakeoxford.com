import { test, expect } from './fixtures';
import { waitForKeyboardResponse } from './utils/test-helpers';

test.describe('Mobile Navigation Visual Test', () => {
  test('should capture mobile navigation state', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to a simple HTML page with our navigation
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Navigation Test</title>
    <style>
        /* Basic styles for testing */
        body { margin: 0; font-family: system-ui; }
        .navbar-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            height: 64px;
        }
        .navbar-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 16px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .brand-section {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .brand-avatar {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: #065f46;
        }
        .brand-text {
            font-weight: 600;
            font-size: 14px;
        }
        .desktop-nav { display: none; }
        .action-buttons {
            display: flex;
            gap: 8px;
        }
        .action-button {
            width: 36px;
            height: 36px;
            border: none;
            background: transparent;
            border-radius: 8px;
            cursor: pointer;
        }
        .burger-menu-button {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .burger-container {
            width: 18px;
            height: 14px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .burger-piece {
            width: 100%;
            height: 2px;
            background: #000;
            border-radius: 1px;
            transition: all 0.3s ease;
        }
        .mobile-menu {
            position: fixed;
            top: 0;
            right: -85vw;
            width: min(300px, 85vw);
            height: 100vh;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            z-index: 1010;
            transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-menu.active {
            right: 0;
        }
        .mobile-menu-content {
            height: 100%;
            overflow-y: auto;
        }
        .mobile-menu-header {
            padding: 16px 24px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: flex-end;
        }
        .mobile-close-button {
            width: 36px;
            height: 36px;
            border: none;
            background: transparent;
            border-radius: 8px;
        }
        .mobile-nav {
            padding: 24px 0;
        }
        .mobile-nav-links {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        .mobile-nav-item {
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        .mobile-nav-link {
            display: block;
            padding: 16px 24px;
            text-decoration: none;
            color: #000;
            font-weight: 500;
        }
        .main-content {
            margin-top: 64px;
            padding: 24px 16px;
            min-height: 600px;
        }
        
        /* Burger animation */
        .burger-menu-button.active .burger-piece:nth-child(1) {
            transform: rotate(45deg) translate(2px, 2px);
        }
        .burger-menu-button.active .burger-piece:nth-child(2) {
            opacity: 0;
        }
        .burger-menu-button.active .burger-piece:nth-child(3) {
            transform: rotate(-45deg) translate(2px, -2px);
        }
    </style>
</head>
<body>
    <nav class="navbar-container">
        <div class="navbar-content">
            <div class="brand-section">
                <div class="brand-avatar"></div>
                <span class="brand-text">Blake Oxford</span>
            </div>
            <div class="action-buttons">
                <button class="action-button" id="search-toggle">🔍</button>
                <button class="action-button" id="theme-toggle">🌙</button>
                <button class="burger-menu-button" id="nav-toggle">
                    <div class="burger-container">
                        <div class="burger-piece"></div>
                        <div class="burger-piece"></div>
                        <div class="burger-piece"></div>
                    </div>
                </button>
            </div>
        </div>
    </nav>
    
    <div class="mobile-menu" id="mobile-menu">
        <div class="mobile-menu-content">
            <div class="mobile-menu-header">
                <button class="mobile-close-button" id="close-mobile-menu">✕</button>
            </div>
            <nav class="mobile-nav">
                <ul class="mobile-nav-links">
                    <li class="mobile-nav-item">
                        <a href="/about" class="mobile-nav-link">About</a>
                    </li>
                    <li class="mobile-nav-item">
                        <a href="/blog" class="mobile-nav-link">Blog</a>
                    </li>
                    <li class="mobile-nav-item">
                        <a href="/projects" class="mobile-nav-link">Projects</a>
                    </li>
                    <li class="mobile-nav-item">
                        <a href="/contact" class="mobile-nav-link">Contact</a>
                    </li>
                </ul>
            </nav>
        </div>
    </div>
    
    <main class="main-content">
        <h1>Mobile Navigation Test</h1>
        <p>This page demonstrates the improved mobile navigation with better accessibility and responsiveness.</p>
        <p>Key improvements include:</p>
        <ul>
            <li>Proper z-index hierarchy</li>
            <li>Responsive width (85vw max)</li>
            <li>Smooth animations</li>
            <li>Better touch targets</li>
            <li>Focus management</li>
        </ul>
    </main>
    
    <script>
        // Simple JavaScript for testing
        const navToggle = document.getElementById('nav-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const closeButton = document.getElementById('close-mobile-menu');
        
        function openMenu() {
            navToggle.classList.add('active');
            navToggle.setAttribute('aria-expanded', 'true');
            mobileMenu.classList.add('active');
            mobileMenu.setAttribute('data-state', 'open');
            document.body.style.overflow = 'hidden';
        }
        
        function closeMenu() {
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('active');
            mobileMenu.setAttribute('data-state', 'closed');
            document.body.style.overflow = '';
        }
        
        navToggle.addEventListener('click', () => {
            if (mobileMenu.getAttribute('data-state') === 'open') {
                closeMenu();
            } else {
                openMenu();
            }
        });
        
        closeButton.addEventListener('click', closeMenu);
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.getAttribute('data-state') === 'open') {
                closeMenu();
            }
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && 
                !mobileMenu.querySelector('.mobile-menu-content').contains(e.target) &&
                mobileMenu.getAttribute('data-state') === 'open') {
                closeMenu();
            }
        });
    </script>
</body>
</html>`;

    await page.setContent(htmlContent);
    await page.waitForLoadState('domcontentloaded');
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: '/tmp/mobile-nav-closed.png',
      fullPage: false
    });
    
    // Open mobile menu
    await page.click('#nav-toggle');
    await waitForKeyboardResponse(page); // Wait for animation
    
    // Take screenshot of open menu
    await page.screenshot({ 
      path: '/tmp/mobile-nav-open.png',
      fullPage: false
    });
    
    // Verify menu is open
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toHaveAttribute('data-state', 'open');
    
    // Test close functionality
    await page.click('#close-mobile-menu');
    await waitForKeyboardResponse(page); // Wait for animation
    
    // Take screenshot of closed state
    await page.screenshot({ 
      path: '/tmp/mobile-nav-closed-after.png',
      fullPage: false
    });
    
    console.log('Screenshots saved to:');
    console.log('- /tmp/mobile-nav-closed.png');
    console.log('- /tmp/mobile-nav-open.png');
    console.log('- /tmp/mobile-nav-closed-after.png');
  });

  test('should test very small screen', async ({ page }) => {
    // Test on very small screen
    await page.setViewportSize({ width: 320, height: 568 });
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Small Screen Test</title>
    <style>
        body { margin: 0; font-family: system-ui; }
        .navbar-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            height: 64px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        .navbar-content {
            padding: 0 8px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .brand-section {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .brand-avatar {
            width: 26px;
            height: 26px;
            border-radius: 6px;
            background: #065f46;
        }
        .brand-text {
            font-weight: 600;
            font-size: 13px;
        }
        .action-buttons {
            display: flex;
            gap: 4px;
        }
        .action-button {
            width: 32px;
            height: 32px;
            border: none;
            background: transparent;
            border-radius: 6px;
        }
        .mobile-menu {
            position: fixed;
            top: 0;
            right: -90vw;
            width: 90vw;
            height: 100vh;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            z-index: 1010;
            transition: right 0.3s ease;
        }
        .mobile-menu.active {
            right: 0;
        }
        .mobile-menu-header {
            padding: 12px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: flex-end;
        }
        .mobile-nav-links {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        .mobile-nav-link {
            display: block;
            padding: 12px 16px;
            text-decoration: none;
            color: #000;
            font-size: 14px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        .main-content {
            margin-top: 64px;
            padding: 16px 8px;
        }
    </style>
</head>
<body>
    <nav class="navbar-container">
        <div class="navbar-content">
            <div class="brand-section">
                <div class="brand-avatar"></div>
                <span class="brand-text">Blake Oxford</span>
            </div>
            <div class="action-buttons">
                <button class="action-button">🔍</button>
                <button class="action-button">🌙</button>
                <button class="action-button" id="nav-toggle">☰</button>
            </div>
        </div>
    </nav>
    
    <div class="mobile-menu" id="mobile-menu">
        <div class="mobile-menu-header">
            <button id="close-mobile-menu">✕</button>
        </div>
        <ul class="mobile-nav-links">
            <li><a href="/about" class="mobile-nav-link">About</a></li>
            <li><a href="/blog" class="mobile-nav-link">Blog</a></li>
            <li><a href="/projects" class="mobile-nav-link">Projects</a></li>
            <li><a href="/contact" class="mobile-nav-link">Contact</a></li>
        </ul>
    </div>
    
    <main class="main-content">
        <h1>320px Screen Test</h1>
        <p>Testing mobile navigation on very small screens.</p>
    </main>
    
    <script>
        const navToggle = document.getElementById('nav-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const closeButton = document.getElementById('close-mobile-menu');
        
        navToggle.addEventListener('click', () => {
            mobileMenu.setAttribute('data-state', mobileMenu.getAttribute('data-state') === 'open' ? 'closed' : 'open');
        });
        
        closeButton.addEventListener('click', () => {
            mobileMenu.setAttribute('data-state', 'closed');
        });
    </script>
</body>
</html>`;

    await page.setContent(htmlContent);
    await page.waitForLoadState('domcontentloaded');
    
    // Take screenshot of small screen
    await page.screenshot({ 
      path: '/tmp/mobile-nav-320px.png',
      fullPage: false
    });
    
    // Open menu on small screen
    await page.click('#nav-toggle');
    await waitForKeyboardResponse(page); // Wait for animation
    
    await page.screenshot({ 
      path: '/tmp/mobile-nav-320px-open.png',
      fullPage: false
    });
    
    console.log('Small screen screenshots saved to:');
    console.log('- /tmp/mobile-nav-320px.png');
    console.log('- /tmp/mobile-nav-320px-open.png');
  });
});
