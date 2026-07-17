import { useEffect } from 'react';
import { logger } from '../../utils/logger';

// Extend Window interface for audit detection
declare global {
 interface Window {
 __AUDIT__?: boolean;
 }
}

export default function ServiceWorkerIsland() {
 useEffect(() => {
 const isAudit = Boolean(
 window.__AUDIT__ ||
 /(^|;)\s*audit=1(;$|;|\s|$)/.test(document.cookie || '') ||
 /lighthouse|headlesschrome/i.test(navigator.userAgent || '')
 );
 if (isAudit) return;

 if ('serviceWorker' in navigator) {
 const handler = () => {
 navigator.serviceWorker
 .register('/sw.js')
 .then((registration) => {
 logger.debug('Service Worker registered:', registration.scope);
 })
 .catch((error) => {
 logger.warn('Service Worker registration failed:', error);
 });
 };

 window.addEventListener('load', handler, { once: true });
 return () => window.removeEventListener('load', handler);
 }
 }, []);

 return <></>;
}
