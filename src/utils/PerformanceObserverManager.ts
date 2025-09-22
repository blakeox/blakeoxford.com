/**
 * Performance Observer Manager - Consolidates Performance Monitoring
 * Eliminates redundant PerformanceObserver instances across monitoring systems
 */

export interface PerformanceObserverCallback {
  (entries: PerformanceEntry[]): void;
}

export interface ObserverSubscription {
  id: string;
  entryTypes: string[];
  callback: PerformanceObserverCallback;
  system: string; // Which monitoring system registered this
}

export class PerformanceObserverManager {
  private static instance: PerformanceObserverManager;
  private observers = new Map<string, PerformanceObserver>();
  private subscriptions = new Map<string, ObserverSubscription>();
  private entryTypeCallbacks = new Map<string, PerformanceObserverCallback[]>();
  private isEnabled = true;
  private debugMode = false;

  private constructor() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      this.isEnabled = false;
    }
  }

  static getInstance(): PerformanceObserverManager {
    if (!PerformanceObserverManager.instance) {
      PerformanceObserverManager.instance = new PerformanceObserverManager();
    }
    return PerformanceObserverManager.instance;
  }

  /**
   * Subscribe to performance entries - consolidates multiple subscriptions
   */
  subscribe(
    entryTypes: string[],
    callback: PerformanceObserverCallback,
    system: string,
    options?: { buffered?: boolean }
  ): string {
    if (!this.isEnabled) {
      if (this.debugMode) {
        console.warn(`PerformanceObserver not available, skipping subscription for ${system}`);
      }
      return '';
    }

  const subscriptionId = `${system}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    
    // Register subscription
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      entryTypes,
      callback,
      system
    });

    // Register callbacks for each entry type
    entryTypes.forEach(entryType => {
      if (!this.entryTypeCallbacks.has(entryType)) {
        this.entryTypeCallbacks.set(entryType, []);
      }
      this.entryTypeCallbacks.get(entryType)!.push(callback);

      // Create or reuse observer for this entry type
      this.ensureObserver(entryType, options?.buffered);
    });

    if (this.debugMode) {
      console.log(`📊 Performance subscription added for ${system}:`, {
        subscriptionId,
        entryTypes,
        totalSubscriptions: this.subscriptions.size
      });
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from performance monitoring
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    // Remove callbacks
    subscription.entryTypes.forEach(entryType => {
      const callbacks = this.entryTypeCallbacks.get(entryType);
      if (callbacks) {
        const index = callbacks.indexOf(subscription.callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }

        // If no more callbacks for this entry type, disconnect observer
        if (callbacks.length === 0) {
          this.disconnectObserver(entryType);
        }
      }
    });

    this.subscriptions.delete(subscriptionId);

    if (this.debugMode) {
      console.log(`📊 Performance subscription removed: ${subscriptionId}`);
    }
  }

  /**
   * Ensure observer exists for entry type
   */
  private ensureObserver(entryType: string, buffered = false): void {
    if (this.observers.has(entryType)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const callbacks = this.entryTypeCallbacks.get(entryType) || [];
        
        // Call all registered callbacks for this entry type
        callbacks.forEach(callback => {
          try {
            callback(entries);
          } catch (error) {
            console.error(`Error in performance callback for ${entryType}:`, error);
          }
        });
      });

      const observerOptions: PerformanceObserverInit = { entryTypes: [entryType] };
      if (buffered) {
        observerOptions.buffered = true;
      }

      observer.observe(observerOptions);
      this.observers.set(entryType, observer);

      if (this.debugMode) {
        console.log(`📊 Created PerformanceObserver for: ${entryType}`);
      }
    } catch (error) {
      console.warn(`Failed to create PerformanceObserver for ${entryType}:`, error);
    }
  }

  /**
   * Disconnect observer for entry type
   */
  private disconnectObserver(entryType: string): void {
    const observer = this.observers.get(entryType);
    if (observer) {
      observer.disconnect();
      this.observers.delete(entryType);
      this.entryTypeCallbacks.delete(entryType);

      if (this.debugMode) {
        console.log(`📊 Disconnected PerformanceObserver for: ${entryType}`);
      }
    }
  }

  /**
   * Get subscription statistics
   */
  getStats(): {
    totalSubscriptions: number;
    activeObservers: number;
    subscriptionsBySystem: Record<string, number>;
    entryTypeSubscriptions: Record<string, number>;
  } {
    const subscriptionsBySystem: Record<string, number> = {};
    const entryTypeSubscriptions: Record<string, number> = {};

    this.subscriptions.forEach(sub => {
      subscriptionsBySystem[sub.system] = (subscriptionsBySystem[sub.system] || 0) + 1;
      sub.entryTypes.forEach(type => {
        entryTypeSubscriptions[type] = (entryTypeSubscriptions[type] || 0) + 1;
      });
    });

    return {
      totalSubscriptions: this.subscriptions.size,
      activeObservers: this.observers.size,
      subscriptionsBySystem,
      entryTypeSubscriptions
    };
  }

  /**
   * Enable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    if (enabled) {
      console.log('📊 PerformanceObserverManager debug mode enabled');
    }
  }

  /**
   * Cleanup all observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.subscriptions.clear();
    this.entryTypeCallbacks.clear();

    if (this.debugMode) {
      console.log('📊 PerformanceObserverManager cleaned up');
    }
  }

  /**
   * Check if performance monitoring is available
   */
  isAvailable(): boolean {
    return this.isEnabled;
  }
}

// Global instance management
export function getPerformanceObserverManager(): PerformanceObserverManager {
  return PerformanceObserverManager.getInstance();
}

// Auto-initialize on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      getPerformanceObserverManager();
    });
  } else {
    getPerformanceObserverManager();
  }
}
