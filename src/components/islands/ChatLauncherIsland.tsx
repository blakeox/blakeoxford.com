import { useEffect } from 'react';

/**
 * ChatLauncherIsland
 * A tiny interactive island that hydrates on load and toggles the
 * shared chat wrapper/panel visibility. This replaces the previous
 * inline fallback script and follows best-practice hydration.
 */
export default function ChatLauncherIsland() {
    useEffect(() => {
        try {
            // Signal that the hydrated launcher is present so the inline fallback avoids registering.
            // This prevents duplicate listeners and keeps toggle behavior deterministic.
            try { (window as any).__ai_chat_hydrated = true; } catch { /* noop */ }
        } catch (err) { /* noop */ }
        try {
            const launcher = document.querySelector('.ai-chat-launcher');
            const wrapper = launcher?.closest('[data-ai-chat-open]') as HTMLElement | null;
            const panel = document.querySelector('[data-ai-chat-panel]') as HTMLElement | null;
            if (!launcher || !panel || !wrapper) return;

            function setOpen(open: boolean) {
                // wrapper/panel are captured from outer scope; assert non-null for TypeScript narrowing
                wrapper!.setAttribute('data-ai-chat-open', open ? 'true' : 'false');
                // toggle wrapper pointer-events so composer can be focused
                if (open) wrapper!.classList.remove('pointer-events-none');
                else wrapper!.classList.add('pointer-events-none');
                panel!.setAttribute('data-ai-visible', open ? 'true' : 'false');
                if (open) {
                    panel!.classList.remove('pointer-events-none', 'translate-y-4', 'opacity-0');
                    panel!.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
                    // Move focus to composer if available for accessibility/tests
                    const composer = panel!.querySelector('textarea, input') as HTMLElement | null;
                        if (composer && typeof composer.focus === 'function') {
                        // Blur launcher then attempt multiple focus tries to ensure composer
                        // becomes document.activeElement in test environments.
                        try { (launcher as HTMLElement).blur(); } catch { /* noop */ }

                        const attempts = [0, 10, 50, 150];
                        attempts.forEach((delay) => {
                            setTimeout(() => {
                                try { composer.focus(); } catch { /* noop */ }
                                try { composer.dispatchEvent(new Event('focus', { bubbles: true })); } catch { /* noop */ }
                                try { composer.dispatchEvent(new Event('focusin', { bubbles: true })); } catch { /* noop */ }
                            }, delay);
                        });
                        // Also try on next animation frame.
                        try { requestAnimationFrame(() => { try { composer.focus(); } catch { /* noop */ } }); } catch { /* noop */ }
                    }
                } else {
                    panel!.classList.add('pointer-events-none', 'translate-y-4', 'opacity-0');
                    panel!.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
                }
                // Dispatch a deterministic event so the AIChatIsland can synchronize React state
                try {
                    window.dispatchEvent(new CustomEvent('ai-chat:state', { detail: { open } }));
                } catch (err) {
                    /* noop */
                }
            }

            const clickHandler = (e: Event) => {
                e.preventDefault();
                const isOpen = wrapper!.getAttribute('data-ai-chat-open') === 'true';
                setOpen(!isOpen);
            };

            launcher.addEventListener('click', clickHandler, { passive: false });
            return () => launcher.removeEventListener('click', clickHandler);
        } catch (err) {
            // Non-fatal: if the DOM shape differs, fallback to no-op
            // but avoid noisy console errors in production tests.
             
            console.warn('ChatLauncherIsland init failed', err);
        }
    }, []);

    return (
        <button
            className="ai-chat-launcher pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border border-[color:var(--border)]/60 bg-[color:var(--glass-surface-bg)]/95 text-[color:var(--fg)] shadow-lg backdrop-blur supports-[backdrop-filter]:bg-[color:var(--glass-surface-bg)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
            aria-label="Open AI search assistant"
            type="button"
        >
            <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
            </svg>
        </button>
    );
}
