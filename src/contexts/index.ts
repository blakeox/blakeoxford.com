/**
 * Contexts Barrel Export
 *
 * Central export point for all React contexts.
 *
 * @module contexts
 */

// Theme Context
export {
  ThemeProvider,
  useTheme,
  useIsDark,
  type Theme,
  type ResolvedTheme,
  type ThemePreference,
  type ThemeContextValue,
  type ThemeProviderProps,
} from './ThemeContext';
