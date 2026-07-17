import { useEffect } from 'react';

/**
 * Optional Cloudflare Web Analytics beacon.
 * Enable with PUBLIC_CF_WEB_ANALYTICS_TOKEN from the CF dashboard.
 */
export default function CloudflareBeaconIsland() {
	useEffect(() => {
		const token = import.meta.env.PUBLIC_CF_WEB_ANALYTICS_TOKEN?.trim();
		if (!token || typeof document === 'undefined') return;
		if (document.querySelector('script[data-cf-beacon]')) return;

		const script = document.createElement('script');
		script.defer = true;
		script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
		script.setAttribute('data-cf-beacon', JSON.stringify({ token }));
		document.head.appendChild(script);
	}, []);

	return <></>;
}
