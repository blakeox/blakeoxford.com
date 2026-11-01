/** Shared clearance rule for the SSR launcher and the React launcher. */
export function isAskLauncherOccluded(): boolean {
  if (document.body.dataset.hideAskLauncher === 'true') return true;

  const compact = window.matchMedia('(min-width: 640px)').matches;
  const inset = compact ? 24 : 16;
  const size = compact ? 56 : 48;
  const right = window.innerWidth - inset;
  const bottom = window.innerHeight - inset;
  const left = right - size;
  const top = bottom - size;

  return Array.from(document.querySelectorAll<HTMLElement>('[data-chat-avoid-launcher]')).some(
    (element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < right && rect.right > left && rect.top < bottom && rect.bottom > top;
    }
  );
}
