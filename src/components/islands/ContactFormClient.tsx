import ContactFormIsland from './ContactFormIsland';

/**
 * SSR guard wrapper for ContactFormIsland.
 * - On the server (SSR), returns null so no hooks run.
 * - On the client, renders the real island which attaches events/effects.
 */
export default function ContactFormClient() {
  if (typeof window === 'undefined') return null;
  return <ContactFormIsland />;
}
