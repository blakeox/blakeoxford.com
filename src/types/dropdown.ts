/**
 * Dropdown Type Definitions
 * Consolidated types for dropdown functionality
 */

import type { BaseConfig, FocusTrap } from './core';

export interface DropdownConfig extends BaseConfig {
  triggerSelector: string;
  menuSelector: string;
  autoClose?: boolean;
  keyboardNavigation?: boolean;
}

export interface DropdownState {
  isOpen: boolean;
  trigger: HTMLElement;
  menu: HTMLElement;
  focusTrap: FocusTrap | null;
}
