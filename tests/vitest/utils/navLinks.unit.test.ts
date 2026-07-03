import { describe, it, expect } from 'vitest';
import navLinks, {
  navConfig,
  getNavLinkByHref,
  isCurrentPage,
  getActiveNavLink,
} from '../../../src/config/navLinks';

describe('navLinks utility functions', () => {
  describe('Configuration validation', () => {
    it('should have valid structure for all links', () => {
      expect(Array.isArray(navLinks)).toBe(true);
      expect(navLinks.length).toBeGreaterThan(0);
      
      navLinks.forEach((link) => {
        expect(link).toHaveProperty('href');
        expect(link).toHaveProperty('label');
        
        expect(typeof link.href).toBe('string');
        expect(typeof link.label).toBe('string');
        
        expect(link.href).toMatch(/^\/.*$/); // Should start with /
        expect(link.label.length).toBeGreaterThan(0);
        expect(['Home', 'About', 'Projects', 'Blog', 'Contact']).toContain(link.label);
      });
    });

    it('should have unique hrefs', () => {
      const hrefs = navLinks.map(link => link.href);
      const uniqueHrefs = new Set(hrefs);
      expect(uniqueHrefs.size).toBe(hrefs.length);
    });

    it('should include essential navigation items', () => {
      const hrefs = navLinks.map(link => link.href);
      expect(hrefs).toContain('/');
      expect(hrefs).toContain('/about/');
      expect(hrefs).toContain('/projects/');
      expect(hrefs).toContain('/contact/');
    });
  });

  describe('Utility functions', () => {
    it('should test navConfig export', () => {
      expect(navConfig).toBeDefined();
      expect(navConfig.links).toEqual(navLinks);
      expect(Array.isArray(navConfig.socialLinks)).toBe(true);
      expect(navConfig.socialLinks?.length).toBe(3);
      expect(navConfig.socialLinks?.[0]?.label).toBe('GitHub');
    });

    it('should find link by href using exported function', () => {
      const homeLink = getNavLinkByHref('/');
      expect(homeLink).toBeDefined();
      expect(homeLink?.label).toBe('Home');
      
      const aboutLink = getNavLinkByHref('/about/');
      expect(aboutLink).toBeDefined();
      expect(aboutLink?.label).toBe('About');
      
      const nonExistentLink = getNavLinkByHref('/nonexistent/');
      expect(nonExistentLink).toBeUndefined();
    });

    it('should check if current page using exported function', () => {
      // Mock window.location for SSR environment
      const mockLocation = { pathname: '/about/' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true
      });
      
      expect(isCurrentPage('/about/')).toBe(true);
      expect(isCurrentPage('/projects/')).toBe(false);
      
      // Test edge case with root path
      mockLocation.pathname = '/';
      expect(isCurrentPage('/')).toBe(true);
      expect(isCurrentPage('/about/')).toBe(false);
    });

    it('should handle undefined window.location in isCurrentPage', () => {
      // Test case where window exists but window.location is undefined
      const originalLocation = window.location;
      // @ts-expect-error - intentionally setting to undefined for testing
      delete window.location;
      
      expect(isCurrentPage('/any-page/')).toBe(false);
      
      // Restore window.location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true
      });
    });

    it('should get active nav link using exported function', () => {
      const mockLocation = { pathname: '/projects/' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true
      });
      
      const activeLink = getActiveNavLink();
      expect(activeLink).toBeDefined();
      expect(activeLink?.href).toBe('/projects/');
      expect(activeLink?.label).toBe('Projects');
      
      // Test with non-nav page
      mockLocation.pathname = '/some-random-page/';
      const noActiveLink = getActiveNavLink();
      expect(noActiveLink).toBeUndefined();
    });

    it('should handle undefined window.location in getActiveNavLink', () => {
      // Test case where window exists but window.location is undefined
      const originalLocation = window.location;
      // @ts-expect-error - intentionally setting to undefined for testing
      delete window.location;
      
      expect(getActiveNavLink()).toBeUndefined();
      
      // Restore window.location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true
      });
    });
  });
});
