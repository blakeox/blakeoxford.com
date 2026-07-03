import CommandCenter from './CommandCenter';

/**
 * Client-only mount for the Command Center portal.
 */
export default function CommandCenterMount() {
  if (typeof window === 'undefined') return null;
  return <CommandCenter />;
}
