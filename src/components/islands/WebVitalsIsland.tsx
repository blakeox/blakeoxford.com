import { useEffect } from 'react';
import { initWebVitals } from '../../lib/webVitals';

/**
 * Idle-deferred Core Web Vitals reporter → Zaraz/GA4.
 */
export default function WebVitalsIsland() {
	useEffect(() => {
		const run = () => initWebVitals();

		if ('requestIdleCallback' in window) {
			requestIdleCallback(run, { timeout: 4000 });
		} else {
			setTimeout(run, 2500);
		}
	}, []);

	return null;
}
