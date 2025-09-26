import { useEffect } from 'react';

export default function SkipLinkFocusIsland() {
  useEffect(() => {
    try {
      const skip = document.querySelector<HTMLAnchorElement>('a.skip-link[href="#main-content"]');
      const main = document.getElementById('main-content');
      if (!skip || !main) return;

      const handleSkip = () => setTimeout(() => main.focus(), 0);
      skip.addEventListener('click', handleSkip);

      if (location.hash === '#main-content') {
        setTimeout(() => main.focus(), 0);
      }

      return () => skip.removeEventListener('click', handleSkip);
    } catch (error) {
      console.warn('Skip link focus handling failed', error);
    }
  }, []);

  return null;
}
