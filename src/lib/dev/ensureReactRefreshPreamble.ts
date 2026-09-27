/**
 * Dev pages with no React island omit Vite's refresh preamble. A later dynamic
 * import of a prebundled React client then throws `$RefreshSig$ is not defined`.
 */
export function ensureReactRefreshPreamble(): void {
  if (!import.meta.env.DEV || typeof window === 'undefined') return;

  const runtime = window as Window & {
    $RefreshSig$?: () => (type: unknown) => unknown;
    $RefreshReg$?: (type: unknown, id: string) => void;
  };
  if (typeof runtime.$RefreshSig$ === 'function') return;

  runtime.$RefreshSig$ = () => (type) => type;
  runtime.$RefreshReg$ = () => {};
}
