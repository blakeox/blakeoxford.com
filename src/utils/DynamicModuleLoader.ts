/**
 * Minimal dynamic module loader metrics stub used by PerformanceMonitor.
 * Provides runtime-safe no-op implementations while enabling strict typing.
 */

type LoadingStats = {
  loadedCount: number;
  totalLoadTime: number;
  failedCount: number;
};

class DynamicModuleLoader {
  private stats: LoadingStats = {
    loadedCount: 0,
    totalLoadTime: 0,
    failedCount: 0,
  };

  recordLoad(duration: number): void {
    this.stats.loadedCount += 1;
    this.stats.totalLoadTime += duration;
  }

  recordFailure(): void {
    this.stats.failedCount += 1;
  }

  getLoadingStats(): LoadingStats {
    return { ...this.stats };
  }
}

let loaderInstance: DynamicModuleLoader | undefined;

export function getDynamicModuleLoader(): DynamicModuleLoader {
  if (!loaderInstance) {
    loaderInstance = new DynamicModuleLoader();
  }
  return loaderInstance;
}
