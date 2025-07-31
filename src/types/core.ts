/**
 * Core Type Definitions - Consolidated shared interfaces
 * This file consolidates commonly used interfaces across the application
 */

// Base configuration interface that other configs can extend
export interface BaseConfig {
  debug?: boolean;
  enabled?: boolean;
}

// Shared UI interfaces
export interface FocusTrap {
  activate: () => void;
  deactivate: () => void;
  handleKeyDown: (event: KeyboardEvent) => void;
}

export interface ComponentState<T = Record<string, unknown>> {
  isInitialized: boolean;
  isActive: boolean;
  data?: T;
}

// Event handling interfaces
export interface EventData {
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  timestamp?: number;
  custom?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UserAction {
  label: string;
  action: () => void;
  primary?: boolean;
  disabled?: boolean;
}

// Performance and monitoring
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category?: 'navigation' | 'rendering' | 'network' | 'javascript' | 'performance';
}

// Module initialization
export interface ModuleInitializer<T extends BaseConfig = BaseConfig> {
  init(config?: T): void;
  destroy(): void;
  updateConfig(config: Partial<T>): void;
  getConfig(): T;
}

// Error handling
export interface ErrorInfo {
  type: 'javascript' | 'promise' | 'network' | 'resource' | 'validation' | 'form';
  message: string;
  details?: string;
  technical?: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: string;
  id: string;
  actions?: UserAction[];
}

// Validation
export interface ValidationRule<T = unknown> {
  name: string;
  validator: (value: T) => boolean | Promise<boolean>;
  message: string;
  async?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  field?: string;
}
