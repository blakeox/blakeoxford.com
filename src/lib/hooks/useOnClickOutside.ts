/**
 * useOnClickOutside - Hook for detecting clicks outside an element
 *
 * Useful for modals, dropdowns, mobile menus, and other UI patterns
 * that should close when clicking outside their container.
 *
 * @example
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null);
 * useOnClickOutside(menuRef, () => setIsOpen(false));
 * ```
 *
 * @example Multiple refs
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null);
 * const buttonRef = useRef<HTMLButtonElement>(null);
 * useOnClickOutside([menuRef, buttonRef], () => setIsOpen(false));
 * ```
 *
 * @param ref - Single ref or array of refs to check against
 * @param handler - Callback when click occurs outside the ref element(s)
 * @param enabled - Optional flag to enable/disable the listener
 */
import { useEffect, type RefObject } from 'react';

type RefOrRefs<T extends HTMLElement = HTMLElement> = RefObject<T | null> | RefObject<T | null>[];

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefOrRefs<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent): void => {
      const refs = Array.isArray(ref) ? ref : [ref];
      const target = event.target as Node | null;

      // Check if click was inside any of the refs
      const isInsideAnyRef = refs.some((r) => {
        if (!r.current) return false;
        return r.current.contains(target);
      });

      if (isInsideAnyRef) return;

      handler(event);
    };

    // Use mousedown/touchstart for immediate response
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener, { passive: true });

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
}
