import { useEffect } from 'react';

export default function ExperimentsCookieIsland() {
  useEffect(() => {
    try {
      const isAudit = Boolean(
        (window as any).__AUDIT__ ||
        /(^|;)\s*audit=1(;$|;|\s|$)/.test(document.cookie || '') ||
        /lighthouse|headlesschrome/i.test(navigator.userAgent || '')
      );
      if (isAudit) return;

      const name = 'ab-test-group';
      if (document.cookie.includes(`${name}=`)) return;

      const group = Math.random() < 0.5 ? 'A' : 'B';
      const maxAge = 60 * 60 * 24 * 30; // 30 days
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${name}=${group}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
    } catch (error) {
      console.warn('Experiment cookie initialization failed', error);
    }
  }, []);

  return null;
}
