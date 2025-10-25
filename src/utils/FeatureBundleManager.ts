/**
 * Lightweight bundle metrics manager consumed by PerformanceMonitor.
 * Tracks bundle registration and basic size/load statistics.
 */

type BundleDetail = {
  name: string;
  moduleCount: number;
  estimatedSize: number;
  loadedSize: number;
  loaded: boolean;
};

interface BundleStats {
  loadedBundles: number;
  totalEstimatedSize: number;
  loadedSize: number;
  bundleDetails: Array<Pick<BundleDetail, 'name' | 'moduleCount' | 'loaded'>>;
}

class FeatureBundleManager {
  private bundles = new Map<string, BundleDetail>();

  registerBundle(name: string, moduleCount: number, estimatedSize: number): void {
    if (!this.bundles.has(name)) {
      this.bundles.set(name, {
        name,
        moduleCount,
        estimatedSize,
        loadedSize: 0,
        loaded: false,
      });
    }
  }

  markLoaded(name: string, loadedSize: number): void {
    const bundle = this.bundles.get(name);
    if (!bundle) {
      this.bundles.set(name, {
        name,
        moduleCount: 0,
        estimatedSize: loadedSize,
        loadedSize,
        loaded: true,
      });
      return;
    }

    bundle.loadedSize = loadedSize;
    bundle.loaded = true;
    this.bundles.set(name, bundle);
  }

  getBundleStats(): BundleStats {
    let loadedBundles = 0;
    let totalEstimatedSize = 0;
    let loadedSize = 0;

    const bundleDetails = Array.from(this.bundles.values()).map((bundle) => {
      totalEstimatedSize += bundle.estimatedSize;
      if (bundle.loaded) {
        loadedBundles += 1;
        loadedSize += bundle.loadedSize;
      }

      return {
        name: bundle.name,
        moduleCount: bundle.moduleCount,
        loaded: bundle.loaded,
      };
    });

    return {
      loadedBundles,
      totalEstimatedSize,
      loadedSize,
      bundleDetails,
    };
  }
}

let bundleManagerInstance: FeatureBundleManager | undefined;

export function getFeatureBundleManager(): FeatureBundleManager {
  if (!bundleManagerInstance) {
    bundleManagerInstance = new FeatureBundleManager();
  }
  return bundleManagerInstance;
}
