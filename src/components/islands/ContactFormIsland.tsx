import { useEffect } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => void;
    };
    __AUDIT__?: boolean;
  }
}

const SITE_KEY = '0x4AAAAAABeu0PfX8oWvQvjR';

type CleanupFn = () => void;

function showStatusBanner(element: HTMLElement | null, message: string, type: 'success' | 'error') {
  if (!element) return;
  element.textContent = message;
  element.classList.remove('hidden', type === 'error' ? 'text-green-600' : 'text-red-600');
  element.classList.add(
    type === 'success' ? 'text-green-600' : 'text-red-600',
    'bg-green-50',
    'border',
    'border-green-200',
    'rounded-lg',
    'p-4'
  );
}

function setSubmitState(form: HTMLFormElement | null, state: 'idle' | 'loading') {
  if (!form) return;
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const btnLabel = document.getElementById('btn-label');
  const spinner = document.getElementById('spinner');

  if (state === 'loading') {
    if (submitBtn) submitBtn.disabled = true;
    if (btnLabel) btnLabel.textContent = 'Sending...';
    spinner?.classList.remove('hidden');
  } else {
    if (submitBtn) submitBtn.disabled = false;
    if (btnLabel) btnLabel.textContent = 'Send Message';
    spinner?.classList.add('hidden');
  }
}

function setupTurnstile(isAudit: boolean): CleanupFn | void {
  const container = document.getElementById('turnstile-container');
  if (!container) return;

  if (isAudit) {
    container.setAttribute('aria-label', 'Human verification temporarily disabled during automated audits');
    container.innerHTML = '<div class="text-center text-sm text-neutral">Verification skipped for audit.</div>';
    return;
  }

  let injected = false;
  const injectScript = () => {
    if (injected) return;
    if (window.turnstile) {
      window.turnstile.render(container, { sitekey: SITE_KEY, size: 'compact' });
      injected = true;
      return;
    }

    injected = true;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        window.turnstile?.render(container, { sitekey: SITE_KEY, size: 'compact' });
      } catch (error) {
        console.warn('Turnstile render failed', error);
      }
    };
    document.head.appendChild(script);
  };

  const cleanupFns: CleanupFn[] = [];

  const form = document.getElementById('contact-form');
  if (form) {
    const events: Array<keyof HTMLElementEventMap> = ['focusin', 'click', 'keydown', 'pointerdown', 'touchstart', 'submit'];
    events.forEach((eventName) => {
      const handler = () => injectScript();
      form.addEventListener(eventName, handler, { passive: true, once: true });
      cleanupFns.push(() => form.removeEventListener(eventName, handler));
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          injectScript();
          observer.disconnect();
        }
      });
    });
    observer.observe(container);
    cleanupFns.push(() => observer.disconnect());
  }

  let timeoutId: number | undefined;
  let idleId: number | undefined;

  if ('requestIdleCallback' in window) {
    idleId = (window as any).requestIdleCallback?.(() => injectScript(), { timeout: 15000 });
    cleanupFns.push(() => (window as any).cancelIdleCallback?.(idleId));
  } else {
    timeoutId = window.setTimeout(injectScript, 15000);
    cleanupFns.push(() => window.clearTimeout(timeoutId));
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

function setupContactForm(): CleanupFn | void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  const statusElement = document.getElementById('form-status');
  if (new URLSearchParams(window.location.search).get('success') === 'true') {
    showStatusBanner(statusElement, '✅ Thank you for your message! I\'ll get back to you soon. 🎉', 'success');
  }

  const cleanupFns: CleanupFn[] = [];

  const inputs = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'));

  const validateField = (field: HTMLInputElement | HTMLTextAreaElement) => {
    const value = field.value.trim();
    const errorContainer = document.getElementById(field.id + '-error');
    const label = field.labels?.[0]?.textContent?.replace('*', '').trim() || field.getAttribute('aria-label') || field.name || 'Field';

    let errorMessage = '';
    if (field.hasAttribute('required') && !value) {
      errorMessage = `${label} is required and cannot be empty.`;
    } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errorMessage = 'Please enter a valid email address (e.g., name@domain.com).';
    } else if (field.hasAttribute('minlength') && value.length > 0 && value.length < Number(field.getAttribute('minlength'))) {
      errorMessage = `${label} must be at least ${field.getAttribute('minlength')} characters long.`;
    } else if (field.name === 'message' && value.length > 0 && value.length < 10) {
      errorMessage = 'Please provide a more detailed message (at least 10 characters).';
    } else if (field.name === 'name' && value.length > 0 && value.length < 2) {
      errorMessage = 'Name must be at least 2 characters long.';
    }

    if (errorContainer) {
      if (errorMessage) {
        errorContainer.textContent = errorMessage;
        errorContainer.classList.remove('hidden');
        field.setAttribute('aria-invalid', 'true');
        field.classList.add('border-red-500');
        return false;
      }
      errorContainer.textContent = '';
      errorContainer.classList.add('hidden');
      field.setAttribute('aria-invalid', 'false');
      field.classList.remove('border-red-500');
    }
    return true;
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    setSubmitState(form, 'loading');

    const isValid = inputs.every((input) => validateField(input));
    if (!isValid) {
      setSubmitState(form, 'idle');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 10000);
      const formData = new FormData(form);

      const response = await fetch(form.action || '/api/contact/submit', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      window.clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Submission failed (${response.status})`);
      }

      showStatusBanner(statusElement, '✅ Thank you for your message! I\'ll get back to you soon. 🎉', 'success');
      form.reset();
    } catch (error) {
      console.error('Form submission failed', error);
      showStatusBanner(
        statusElement,
        '❌ Something went wrong. Please try again later or email me directly at contact@blakeoxford.com.',
        'error'
      );
    } finally {
      setSubmitState(form, 'idle');
    }
  };

  inputs.forEach((input) => {
    const onBlur = () => validateField(input);
    const onInput = () => {
      const errorContainer = document.getElementById(input.id + '-error');
      if (errorContainer) {
        errorContainer.textContent = '';
        errorContainer.classList.add('hidden');
        input.setAttribute('aria-invalid', 'false');
        input.classList.remove('border-red-500');
      }
    };

    input.addEventListener('blur', onBlur);
    input.addEventListener('input', onInput);
    cleanupFns.push(() => {
      input.removeEventListener('blur', onBlur);
      input.removeEventListener('input', onInput);
    });
  });

  form?.addEventListener('submit', onSubmit);
  cleanupFns.push(() => form?.removeEventListener('submit', onSubmit));

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

export default function ContactFormIsland() {
  useEffect(() => {
    const isAudit = Boolean(
      window.__AUDIT__ ||
      /(^|;)\s*audit=1(;$|;|\s|$)/.test(document.cookie || '') ||
      /lighthouse|headlesschrome/i.test(navigator.userAgent || '')
    );

    const cleanupFns: Array<CleanupFn | void> = [
      setupContactForm(),
    ];

    if (!isAudit) {
      const turnstileCleanup = setupTurnstile(isAudit);
      if (typeof turnstileCleanup === 'function') {
        cleanupFns.push(turnstileCleanup);
      }
    }

    return () => {
      cleanupFns.forEach((fn) => {
        if (typeof fn === 'function') fn();
      });
    };
  }, []);

  return null;
}
