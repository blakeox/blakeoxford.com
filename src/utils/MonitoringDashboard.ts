/**
 * Lightweight monitoring dashboard stub used by AdvancedMonitoringSystem.
 */

export interface MonitoringDashboardConfig {
  enabled: boolean;
  updateInterval: number;
  autoRefresh?: boolean;
  notifications?: {
    enabled: boolean;
    criticalOnly?: boolean;
    sound?: boolean;
  };
}

interface DashboardHistoryEntry {
  timestamp: number;
  message: string;
  visible: boolean;
}

class MonitoringDashboard {
  private history: DashboardHistoryEntry[] = [];
  private visible = false;

  constructor(private readonly config: MonitoringDashboardConfig) {}

  showDashboard(): void {
    if (!this.config.enabled) return;
    this.visible = true;
    this.pushHistory('Dashboard displayed');
  }

  hideDashboard(): void {
    this.visible = false;
    this.pushHistory('Dashboard hidden');
  }

  recordEvent(message: string): void {
    this.pushHistory(message);
  }

  getHistory(): DashboardHistoryEntry[] {
    return [...this.history];
  }

  shutdown(): void {
    this.visible = false;
    this.pushHistory('Dashboard shutdown');
  }

  private pushHistory(message: string): void {
    this.history.push({ timestamp: Date.now(), message, visible: this.visible });
  }
}

export const initMonitoringDashboard = (config: MonitoringDashboardConfig): MonitoringDashboard => {
  return new MonitoringDashboard(config);
};
