/**
 * Centralized Application Configuration with Runtime Updates
 * Single source of truth for all application configuration
 */

import { z } from 'zod';

// Configuration change callback type
export type ConfigChangeCallback = (newConfig: AppConfig, changedKeys: string[]) => void;

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

const AnalyticsProviderSchema = z.enum(['gtag', 'plausible', 'fathom', 'clarity']);

const AnalyticsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  debug: z.boolean().default(false),
  enableTracking: z.boolean().default(true),
  respectDNT: z.boolean().default(true),
  trackPageViews: z.boolean().default(true),
  trackClicks: z.boolean().default(true),
  trackScroll: z.boolean().default(false),
  trackErrors: z.boolean().default(true),
  trackPerformance: z.boolean().default(false),
  providers: z.array(AnalyticsProviderSchema).default([]),
  excludeSelectors: z.array(z.string()).default([]),
});

// Main application configuration schema
const AppConfigSchema = z.object({
  accessibility: AccessibilityConfigSchema,
  dropdown: DropdownConfigSchema,
  search: SearchConfigSchema,
  analytics: AnalyticsConfigSchema,
  
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
export type DropdownConfig = z.infer<typeof DropdownConfigSchema>;
export type SearchConfig = z.infer<typeof SearchConfigSchema>;
export type AnalyticsConfig = z.infer<typeof AnalyticsConfigSchema>;

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
      
    } else if (hostname.includes('staging') || hostname.includes('preview')) {
      envOverrides.environment = 'staging';
    } else {
      envOverrides.environment = 'production';
    }
  }
  
  return AppConfigSchema.parse({
    ...baseConfig,
    ...envOverrides,
    ...overrides
  });
};

/**
 * Enhanced Configuration Manager with Runtime Updates
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  private changeCallbacks: ConfigChangeCallback[] = [];

  private constructor(initialConfig?: Partial<AppConfig>) {
    this.config = createConfig(initialConfig);
  }

  static getInstance(initialConfig?: Partial<AppConfig>): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(initialConfig);
    }
    return ConfigManager.instance;
  }

  /**
   * Get current configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update configuration at runtime with change notifications
   */
  updateConfig(updates: Partial<AppConfig>): void {
    const oldConfig = { ...this.config };
    
    try {
      const newConfig = createConfig({
        ...this.config,
        ...updates
      });
      
      // Find changed keys
      const changedKeys = this.findChangedKeys(oldConfig, newConfig);
      
      if (changedKeys.length > 0) {
        this.config = newConfig;
        
        // Notify all callbacks
        this.changeCallbacks.forEach(callback => {
          try {
            callback(newConfig, changedKeys);
          } catch (error) {
            console.error('Error in config change callback:', error);
          }
        });

        console.log('📊 Configuration updated:', {
          changedKeys,
          environment: newConfig.environment
        });
      }
    } catch (error) {
      console.error('Invalid configuration update:', error);
      throw error;
    }
  }

  /**
   * Subscribe to configuration changes
   */
  onChange(callback: ConfigChangeCallback): () => void {
    this.changeCallbacks.push(callback);
    
    return () => {
      const index = this.changeCallbacks.indexOf(callback);
      if (index > -1) {
        this.changeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get environment-optimized configuration
   */
  getOptimizedConfig(): AppConfig {
    const config = this.getConfig();
    
    return config;
  }

  // Legacy methods for backward compatibility
  getAccessibilityConfig(): AccessibilityConfig {
    return this.config.accessibility;
  }
  
  getDropdownConfig(): DropdownConfig {
    return this.config.dropdown;
  }
  
  getSearchConfig(): SearchConfig {
    return this.config.search;
  }

  getAnalyticsConfig(): AnalyticsConfig {
    return this.config.analytics;
  }

  private findChangedKeys(oldConfig: AppConfig, newConfig: AppConfig): string[] {
    const changedKeys: string[] = [];
    
    const compareObjects = (old: Record<string, unknown>, current: Record<string, unknown>, prefix = ''): void => {
      for (const key in current) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof current[key] === 'object' && current[key] !== null && !Array.isArray(current[key])) {
          if (typeof old[key] === 'object' && old[key] !== null) {
            compareObjects(old[key] as Record<string, unknown>, current[key] as Record<string, unknown>, fullKey);
          } else {
            changedKeys.push(fullKey);
          }
        } else if (old[key] !== current[key]) {
          changedKeys.push(fullKey);
        }
      }
    };
    
    compareObjects(oldConfig, newConfig);
    return changedKeys;
  }
}

// Global configuration manager instance
export const getConfigManager = (initialConfig?: Partial<AppConfig>): ConfigManager => {
  return ConfigManager.getInstance(initialConfig);
};

// Export convenience function
export const getConfig = () => getConfigManager().getConfig();
