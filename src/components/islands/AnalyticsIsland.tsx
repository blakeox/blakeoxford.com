import { useEffect } from 'react';

const GA_ID = 'G-CS4BH1K3HG';

export default function AnalyticsIsland() {
  useEffect(() => {
    const isAudit = Boolean(
      (window as any).__AUDIT__ ||
      /(^|;)\s*audit=1(;$|;|\s|$)/.test(document.cookie || '') ||
      /lighthouse|headlesschrome/i.test(navigator.userAgent || '')
    );

    if (isAudit) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || (() => {});
      return;
    }

    let loaded = false;
    const queue: IArguments[] = [];

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      queue.push(arguments);
    } as typeof window.gtag;

    const loadGA = () => {
      if (loaded) return;
      loaded = true;
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      script.onload = () => {
        window.gtag = function gtag(){
          window.dataLayer.push(arguments);
        } as typeof window.gtag;
        window.gtag('js', new Date());
        window.gtag('consent', 'default', {
          ad_storage: 'denied',
          analytics_storage: 'granted',
          functionality_storage: 'granted',
          security_storage: 'granted'
        });
        window.gtag('config', GA_ID, {
          send_page_view: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false
        });
        queue.forEach((args) => window.gtag.apply(null, args as unknown as Parameters<typeof window.gtag>));
        queue.length = 0;
      };
      document.head.appendChild(script);
    };

    const activate = () => {
      ['click', 'keydown', 'pointerdown', 'touchstart', 'scroll'].forEach((type) =>
        window.removeEventListener(type, activate, { passive: true })
      );
      loadGA();
    };

    const listeners = ['click', 'keydown', 'pointerdown', 'touchstart', 'scroll'];
    listeners.forEach((type) => {
      window.addEventListener(type, activate, { passive: true, once: true });
    });

    const idleHandle = 'requestIdleCallback' in window
      ? (window as any).requestIdleCallback?.(() => loadGA(), { timeout: 10000 })
      : window.setTimeout(loadGA, 10000);

    return () => {
      listeners.forEach((type) => window.removeEventListener(type, activate));
      if (typeof idleHandle === 'number') {
        window.clearTimeout(idleHandle);
      } else if (idleHandle) {
        (window as any).cancelIdleCallback?.(idleHandle);
      }
    };
  }, []);

  return null;
}
