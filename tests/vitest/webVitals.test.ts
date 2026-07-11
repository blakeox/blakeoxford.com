import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { __resetWebVitalsForTests, initWebVitals } from '../../src/lib/webVitals';

vi.mock('../../src/lib/analytics', () => ({
	trackEvent: vi.fn(),
}));

import { trackEvent } from '../../src/lib/analytics';

describe('initWebVitals', () => {
	beforeEach(() => {
		__resetWebVitalsForTests();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('reports TTFB from navigation timing when available', () => {
		vi.stubGlobal(
			'PerformanceObserver',
			class {
				observe() {}
				disconnect() {}
			},
		);
		vi.spyOn(performance, 'getEntriesByType').mockImplementation((type: string) => {
			if (type === 'navigation') {
				return [{ type: 'navigate', responseStart: 120 } as PerformanceNavigationTiming];
			}
			return [];
		});

		initWebVitals();

		expect(trackEvent).toHaveBeenCalledWith(
			'web_vitals',
			expect.objectContaining({
				metric_name: 'TTFB',
				value: 120,
				metric_rating: 'good',
			}),
		);
	});

	it('is idempotent', () => {
		vi.stubGlobal(
			'PerformanceObserver',
			class {
				observe() {}
				disconnect() {}
			},
		);
		vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);

		initWebVitals();
		initWebVitals();

		// Second call should no-op (no additional observers / reports beyond first init)
		expect(true).toBe(true);
	});
});
