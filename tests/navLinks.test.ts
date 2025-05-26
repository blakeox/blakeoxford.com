import { describe, it, expect } from 'vitest';
import navLinks from '../src/config/navLinks';

describe('navLinks configuration', () => {
  it('should contain the correct number of links', () => {
    expect(navLinks).toHaveLength(5);
  });

  it('should have expected link properties', () => {
    const homeLink = navLinks.find(link => link.href === '/');
    expect(homeLink).toBeDefined();
    expect(homeLink).toMatchObject({ label: 'Home', analytics: 'nav-home' });
  });

  it('each link should have href, label, and analytics properties', () => {
    navLinks.forEach(link => {
      expect(link).toHaveProperty('href');
      expect(link).toHaveProperty('label');
      expect(link).toHaveProperty('analytics');
    });
  });
});
