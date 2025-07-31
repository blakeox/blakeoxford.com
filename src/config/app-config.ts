/**
 * Centralized Application Configuration
 * Single source of truth for all application configuration
 */

import { z } from 'zod';

// Zod schemas for runtime validation
const AccessibilityConfigSchema = z.object({
  enabled: z.boolean().default(true),
  debug: z.boolean().default(false),
  enableLiveRegion: z.boolean().default(true),
  enableSkipLink: z.boolean().default(true),
  enableKeyboardShortcuts: z.boolean().default(true),
  enableFocusManagement: z.boolean().default(true),
  enableLandmarkRoles: z.boolean().default(true),
  autoDetectPreferences: z.boolean().default(true),
  savePreferences: z.boolean().default(true),
});

const AnalyticsConfigSchema = z.object({
  enabled: z.boolean().default(true), 
  debug: z.boolean().default(false),
  enableTracking: z.boolean().default(true),
  respectDNT: z.boolean().default(true),
  anonymizeIP: z.boolean().default(true),
  trackPerformance: z.boolean().default(true),
  trackErrors: z.boolean().default(true),
  trackUserJourney: z.boolean().default(true),
  trackPageViews: z.boolean().default(true),
  trackClicks: z.boolean().default(true),
  trackScroll: z.boolean().default(false),
  excludeSelectors: z.array(z.string()).default([]),
  providers: z.array(z.enum(['gtag', 'plausible', 'fathom', 'clarity'])).default([]),
  debugMode: z.boolean().default(false),
});

const DropdownConfigSchema = z.object({
  enabled: z.boolean().default(true),
  debug: z.boolean().default(false),  
  triggerSelector: z.string().default('.nav-link[aria-haspopup="true"]'),
  menuSelector: z.string().default('ul[role="menu"]'),
  autoClose: z.boolean().default(true),
  keyboardNavigation: z.boolean().default(true),
});

const SearchConfigSchema = z.object({
  enabled: z.boolean().default(true),
  debug: z.boolean().default(false),
  enableVoiceSearch: z.boolean().default(true),
  enableSuggestions: z.boolean().default(true),
  maxResults: z.number().default(10),
  threshold: z.number().default(0.3),
  keys: z.array(z.string()).default(['title', 'content', 'tags']),
});

const PerformanceConfigSchema = z.object({
  enabled: z.boolean().default(true),
  debug: z.boolean().default(false),
  monitorCoreWebVitals: z.boolean().default(true),
  monitorResources: z.boolean().default(true),
  monitorJavaScript: z.boolean().default(true),
  reportingInterval: z.number().default(30000), // 30 seconds
});

// Main application configuration schema
const AppConfigSchema = z.object({
  accessibility: AccessibilityConfigSchema,
  analytics: AnalyticsConfigSchema,
  dropdown: DropdownConfigSchema,
  search: SearchConfigSchema,
  performance: PerformanceConfigSchema,
  
  // Global settings
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  version: z.string().default('1.0.0'),
  features: z.object({
    enableServiceWorker: z.boolean().default(false),
    enableOfflineMode: z.boolean().default(false),
    enablePWA: z.boolean().default(false),
  }),
});

// Type inference from Zod schemas
export type AppConfig = z.infer<typeof AppConfigSchema>;
export type AccessibilityConfig = z.infer<typeof AccessibilityConfigSchema>;
export type AnalyticsConfig = z.infer<typeof AnalyticsConfigSchema>;
export type DropdownConfig = z.infer<typeof DropdownConfigSchema>;
export type SearchConfig = z.infer<typeof SearchConfigSchema>;
export type PerformanceConfig = z.infer<typeof PerformanceConfigSchema>;

// Configuration validation
export const validateConfig = (config: unknown): AppConfig => {
  return AppConfigSchema.parse(config);
};

// Default configuration
export const defaultConfig: AppConfig = AppConfigSchema.parse({});

// Configuration factory with environment-specific overrides
export const createConfig = (overrides: Partial<AppConfig> = {}): AppConfig => {
  const baseConfig = defaultConfig;
  
  // Environment-specific overrides
  const envOverrides: Partial<AppConfig> = {};
  
  if (typeof window !== 'undefined') {
    // Browser environment
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      envOverrides.environment = 'development';
      envOverrides.accessibility = { ...baseConfig.accessibility, debug: true };
      envOverrides.analytics = { ...baseConfig.analytics, debug: true };
    } else if (hostname.includes('staging')) {
      envOverrides.environment = 'staging';
    } else {
      envOverrides.environment = 'production';
      envOverrides.accessibility = { ...baseConfig.accessibility, debug: false };
      envOverrides.analytics = { ...baseConfig.analytics, debug: false };
    }
  }
  
  // Merge configurations: base <- environment <- user overrides
  const mergedConfig = {
    ...baseConfig,
    ...envOverrides,
    ...overrides,
    // Deep merge for nested objects
    accessibility: {
      ...baseConfig.accessibility,
      ...envOverrides.accessibility,
      ...overrides.accessibility,
    },
    analytics: {
      ...baseConfig.analytics,
      ...envOverrides.analytics,
      ...overrides.analytics,
    },
    dropdown: {
      ...baseConfig.dropdown,
      ...envOverrides.dropdown,
      ...overrides.dropdown,
    },
    search: {
      ...baseConfig.search,
      ...envOverrides.search,
      ...overrides.search,
    },
    performance: {
      ...baseConfig.performance,
      ...envOverrides.performance,
      ...overrides.performance,
    },
    features: {
      ...baseConfig.features,
      ...envOverrides.features,
      ...overrides.features,
    },
  };
  
  return validateConfig(mergedConfig);
};

// Configuration manager singleton
class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  
  private constructor(initialConfig?: Partial<AppConfig>) {
    this.config = createConfig(initialConfig);
  }
  
  static getInstance(initialConfig?: Partial<AppConfig>): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(initialConfig);
    }
    return ConfigManager.instance;
  }
  
  getConfig(): AppConfig {
    return { ...this.config };
  }
  
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = createConfig({ ...this.config, ...updates });
  }
  
  getAccessibilityConfig(): AccessibilityConfig {
    return this.config.accessibility;
  }
  
  getAnalyticsConfig(): AnalyticsConfig {
    return this.config.analytics;
  }
  
  getDropdownConfig(): DropdownConfig {
    return this.config.dropdown;
  }
  
  getSearchConfig(): SearchConfig {
    return this.config.search;
  }
  
  getPerformanceConfig(): PerformanceConfig {
    return this.config.performance;
  }
}

export { ConfigManager };

// Export convenience function
export const getConfig = () => ConfigManager.getInstance().getConfig();
