import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ThemeToggle from '../../src/components/ThemeToggle';

describe('ThemeToggle component', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Reset document class
    document.documentElement.className = '';
    vi.clearAllTimers();
  });

  it('should set initial theme based on localStorage or prefers-color-scheme', () => {
    // Default: no localStorage, prefersDark mocked as false by vitest.setup
    render(<ThemeToggle />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('should toggle theme on button click', () => {
    const { getByRole } = render(<ThemeToggle />);
    const button = getByRole('button', { name: /toggle between dark and light mode/i });

    // Click to dark
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    // Click to light
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should add and remove animation class when toggling theme', () => {
    vi.useFakeTimers();
    const { getByRole } = render(<ThemeToggle />);
    const button = getByRole('button', { name: /toggle between dark and light mode/i });

    // Click to trigger animation
    fireEvent.click(button);
    
    // Check that animation class is added immediately
    expect(button.classList.contains('theme-toggle-spin')).toBe(true);
    
    // Fast-forward time to trigger the timeout
    vi.advanceTimersByTime(600);
    
    // Check that animation class is removed
    expect(button.classList.contains('theme-toggle-spin')).toBe(false);

    vi.useRealTimers();
  });

  it('should handle animation cleanup when button ref is null', () => {
    vi.useFakeTimers();
    const { getByRole, unmount } = render(<ThemeToggle />);
    const button = getByRole('button', { name: /toggle between dark and light mode/i });

    // Click to trigger animation
    fireEvent.click(button);
    expect(button.classList.contains('theme-toggle-spin')).toBe(true);
    
    // Unmount component to simulate ref becoming null
    unmount();
    
    // Fast-forward time - this should not cause errors
    expect(() => {
      vi.advanceTimersByTime(600);
    }).not.toThrow();

    vi.useRealTimers();
  });
});
