import CommandCenter from './CommandCenter';

/**
 * Client-only mount for the Command Center portal.
 * Prefer `client:only="react"` at the call site — no SSR branch needed.
 */
export default function CommandCenterMount() {
  return <CommandCenter />;
}
