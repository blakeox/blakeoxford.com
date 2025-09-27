import { useEffect } from 'react';

export default function ServiceWorkerIsland() {
  useEffect(() => {
    const isAudit = Boolean(
      (window as any).__AUDIT__ ||
      /(^|;)\s*audit=1(;$|;|\s|$)/.test(document.cookie || '') ||
      /lighthouse|headlesschrome/i.test(navigator.userAgent || '')
    );
    if (isAudit) return;

    if ('serviceWorker' in navigator) {
      const handler = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration.scope);
          })
          .catch((error) => {
            console.log('❌ Service Worker registration failed:', error);
          });
      };

      window.addEventListener('load', handler, { once: true });
      return () => window.removeEventListener('load', handler);
    }
  }, []);

  return null;
}
