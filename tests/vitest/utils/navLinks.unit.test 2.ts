import { describe, it, expect } from 'vitest';
import navLinks from '../../../src/config/navLinks.js';

describe('navLinks utility functions', () => {
  describe('Configuration validation', () => {
    it('should have valid structure for all links', () => {
      expect(Array.isArray(navLinks)).toBe(true);
      expect(navLinks.length).toBeGreaterThan(0);
      
      navLinks.forEach((link) => {
        expect(link).toHaveProperty('href');
        expect(link).toHaveProperty('label');
        expect(link).toHaveProperty('analytics');
        
        expect(typeof link.href).toBe('string');
        expect(typeof link.label).toBe('string');
        expect(typeof link.analytics).toBe('string');
        
        expect(link.href).toMatch(/^\/.*$/); // Should start with /
        expect(link.label.length).toBeGreaterThan(0);
        expect(link.analytics).toMatch(/^nav-/); // Should start with nav-
      });
    });

    it('should have unique hrefs', () => {
      const hrefs = navLinks.map(link => link.href);
      const uniqueHrefs = new Set(hrefs);
      expect(uniqueHrefs.size).toBe(hrefs.length);
    });

    it('should have unique analytics ids', () => {
      const analyticsIds = navLinks.map(link => link.analytics);
      const uniqueAnalyticsIds = new Set(analyticsIds);
      expect(uniqueAnalyticsIds.size).toBe(analyticsIds.length);
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
    it('should find link by href', () => {
      const findLinkByHref = (href: string) => navLinks.find(link => link.href === href);
      
      const homeLink = findLinkByHref('/');
      expect(homeLink).toBeDefined();
      expect(homeLink?.label).toBe('Home');
      
      const aboutLink = findLinkByHref('/about/');
      expect(aboutLink).toBeDefined();
      expect(aboutLink?.label).toBe('About');
    });

    it('should find link by analytics id', () => {
      const findLinkByAnalytics = (analytics: string) => navLinks.find(link => link.analytics === analytics);
      
      const homeLink = findLinkByAnalytics('nav-home');
      expect(homeLink).toBeDefined();
      expect(homeLink?.href).toBe('/');
      
      const projectsLink = findLinkByAnalytics('nav-projects');
      expect(projectsLink).toBeDefined();
      expect(projectsLink?.href).toBe('/projects/');
    });

    it('should filter external vs internal links', () => {
      const internalLinks = navLinks.filter(link => link.href.startsWith('/'));
      const externalLinks = navLinks.filter(link => !link.href.startsWith('/'));
      
      expect(internalLinks.length).toBe(navLinks.length); // All should be internal for this project
      expect(externalLinks.length).toBe(0);
    });
  });
});
