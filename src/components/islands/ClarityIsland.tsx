import { useEffect } from 'react';
import { initClarity } from '../../lib/clarity';

export default function ClarityIsland() {
	useEffect(() => {
		const projectId = import.meta.env.PUBLIC_CLARITY_PROJECT_ID?.trim();
		if (!projectId) return;

		const run = () => initClarity(projectId);

		if ('requestIdleCallback' in window) {
			requestIdleCallback(run, { timeout: 3000 });
		} else {
			setTimeout(run, 2000);
		}
	}, []);

	return null;
}
