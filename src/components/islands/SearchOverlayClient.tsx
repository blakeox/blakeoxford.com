import SearchOverlayController from './SearchOverlayController';

/**
 * SSR guard wrapper for SearchOverlayController.
 * - On the server (SSR), returns null so no hooks run.
 * - On the client, renders the real controller which attaches events/effects.
 */
export default function SearchOverlayClient() {
 if (typeof window === 'undefined') return null;
 return <SearchOverlayController />;
}
