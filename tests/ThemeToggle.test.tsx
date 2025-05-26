import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ThemeToggle from '../src/components/ThemeToggle';

describe('ThemeToggle component', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Reset document class
    document.documentElement.className = '';
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
});
