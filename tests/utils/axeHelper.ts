// Placeholder axe helper - to be expanded in Phase 1
// Intentionally lightweight now; real implementation will integrate @axe-core/playwright
import { Page } from '@playwright/test';

export interface AxeIssue {
  id: string;
  impact?: string;
  description: string;
  nodes?: number;
}

export async function runAxeLite(page: Page): Promise<AxeIssue[]> {
  // Future: inject axe, run, filter critical issues.
  // Reference page to avoid unused var until implemented.
  void page;
  return [];
}
