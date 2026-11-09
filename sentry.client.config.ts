import { installDeferredSentry } from './src/scripts/sentry-loader';

// The Astro integration injects this module into every page. Keep the static
// graph limited to the scheduler; the SDK itself is a dynamic import.
installDeferredSentry();
