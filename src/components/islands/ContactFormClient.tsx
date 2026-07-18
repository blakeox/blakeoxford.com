import ContactFormIsland from './ContactFormIsland';

/**
 * Contact form island. Mount with `client:only="react"` —
 * no SSR null guard (that caused hydration mismatches).
 */
export default function ContactFormClient() {
  return <ContactFormIsland />;
}
