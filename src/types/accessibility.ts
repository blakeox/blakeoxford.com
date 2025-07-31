/**
 * Accessibility Type Definitions
 * Domain-specific types for accessibility features
 */

import type { BaseConfig } from './core';

export interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: 'default' | 'sans-serif' | 'serif' | 'monospace' | 'dyslexic';
  lineHeight: 'tight' | 'normal' | 'relaxed' | 'loose';
  letterSpacing: 'normal' | 'wide' | 'extra-wide';
  colorScheme: 'auto' | 'light' | 'dark';
  highContrast: boolean;
  reducedMotion: boolean;
  soundEnabled: boolean;
  voiceAnnouncements: boolean;
  focusIndicator: 'default' | 'enhanced' | 'high-visibility';
  cursorSize: 'default' | 'large' | 'extra-large';
  underlineLinks: boolean;
  hideImages: boolean;
  simplifyLayout: boolean;
}

export interface AccessibilityConfig extends BaseConfig {
  enableLiveRegion?: boolean;
  enableSkipLink?: boolean;
  enableKeyboardShortcuts?: boolean;
  enableFocusManagement?: boolean;
  enableLandmarkRoles?: boolean;
  autoDetectPreferences?: boolean;
  savePreferences?: boolean;
}

export interface AccessibilityAnnouncement {
  message: string;
  priority: 'polite' | 'assertive' | 'off';
  delay?: number;
}

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  action: () => void;
  global?: boolean;
}

// Re-export FocusTrap from core for backwards compatibility
export type { FocusTrap } from './core';
