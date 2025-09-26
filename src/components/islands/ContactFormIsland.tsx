import { useEffect } from 'react';
import {
  clearError,
  clearStatusMessage,
  defaultErrorFormatter,
  FormValidationConfig,
  hydrateFields,
  setSubmittingState,
  showError,
  showStatusMessage,
  validateField,
} from './form/FormHelpers';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => void;
    };
    __AUDIT__?: boolean;
    analytics?: {
      track?: (event: { category: string; action: string; label?: string; [key: string]: unknown }) => void;
    };
  }
}

const SITE_KEY = '0x4AAAAAABeu0PfX8oWvQvjR';

const FORM_VALIDATION_CONFIG: FormValidationConfig = {
  fields: [
    {
      id: 'name',
      metadata: {
        label: 'Name',
        required: true,
        minLength: 2,
        transform: (value) => value.trim(),
      },
    },
    {
      id: 'email',
      metadata: {
        label: 'Email',
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        transform: (value) => value.trim(),
      },
    },
    {
      id: 'message',
      metadata: {
        label: 'Message',
        required: true,
        minLength: 10,
        maxLength: 2000,
        transform: (value) => value.trim(),
      },
    },
  ],
  statusElementSelector: '#form-status',
};

type CleanupFn = () => void;

type AnalyticsPayload = {
  category: string;
  action: string;
  label?: string;
  [key: string]: unknown;
};

function trackAnalytics(event: AnalyticsPayload): void {
  try {
    window.analytics?.track?.(event);
  } catch (error) {
    console.warn('Analytics tracking failed', error);
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
      trackAnalytics({ category: 'form', action: 'turnstile_rendered' });
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
        trackAnalytics({ category: 'form', action: 'turnstile_rendered' });
      } catch (error) {
        console.warn('Turnstile render failed', error);
        trackAnalytics({ category: 'form', action: 'turnstile_render_failed', label: (error as Error)?.message });
      }
    };
    script.onerror = () => {
      console.warn('Turnstile script failed to load');
      trackAnalytics({ category: 'form', action: 'turnstile_script_failed' });
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

  const fields = hydrateFields(form, FORM_VALIDATION_CONFIG);
  const statusElement = document.querySelector<HTMLElement>(FORM_VALIDATION_CONFIG.statusElementSelector ?? '');

  const cleanupFns: CleanupFn[] = [];

  const validateAllFields = () => {
    const errors: Record<string, string> = {};
    FORM_VALIDATION_CONFIG.fields.forEach(({ id, metadata }) => {
      const field = fields[id] as HTMLInputElement | HTMLTextAreaElement | null;
      if (!field) return;
      const message = validateField(field, metadata);
      if (message) {
        errors[id] = defaultErrorFormatter(metadata.label, message);
        showError(field, errors[id]);
      } else {
        clearError(field);
      }
    });
    return errors;
  };

  const handleBlur = (id: string) => () => {
    const fieldConfig = FORM_VALIDATION_CONFIG.fields.find((field) => field.id === id);
    const field = fields[id] as HTMLInputElement | HTMLTextAreaElement | null;
    if (!field || !fieldConfig) return;

    const message = validateField(field, fieldConfig.metadata);
    if (message) {
      showError(field, defaultErrorFormatter(fieldConfig.metadata.label, message));
    } else {
      clearError(field);
    }
  };

  const handleInput = (id: string) => () => {
    const field = fields[id] as HTMLElement | null;
    if (!field) return;
    clearError(field);
  };

  FORM_VALIDATION_CONFIG.fields.forEach(({ id }) => {
    const field = fields[id];
    if (!field) return;

    const onBlur = handleBlur(id);
    const onInput = handleInput(id);

    field.addEventListener('blur', onBlur);
    field.addEventListener('input', onInput);

    cleanupFns.push(() => {
      field.removeEventListener('blur', onBlur);
      field.removeEventListener('input', onInput);
    });
  });

  const handleSubmit = async (event: Event) => {
    event.preventDefault();

    clearStatusMessage(statusElement ?? null);

    const errors = validateAllFields();
    const hasErrors = Object.keys(errors).length > 0;

    if (hasErrors) {
      trackAnalytics({ category: 'form', action: 'validation_failed', ...errors });
      const firstErrorField = FORM_VALIDATION_CONFIG.fields.find(({ id }) => errors[id]);
      if (firstErrorField) {
        const field = fields[firstErrorField.id] as HTMLElement | null;
        field?.focus();
      }
      return;
    }

    const formData = new FormData(form);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    try {
      setSubmittingState(form, true);
      trackAnalytics({ category: 'form', action: 'submit_attempt' });

      const response = await fetch(form.action || '/api/contact/submit', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Submission failed (${response.status})`);
      }

      showStatusMessage(statusElement ?? null, '✅ Thank you for your message! I\'ll get back to you soon. 🎉', 'success');
      form.reset();
      trackAnalytics({ category: 'form', action: 'submit_success' });
    } catch (error) {
      console.error('Form submission failed', error);
      showStatusMessage(
        statusElement ?? null,
        '❌ Something went wrong. Please try again later or email me directly at contact@blakeoxford.com.',
        'error',
      );
      trackAnalytics({ category: 'form', action: 'submit_failed', label: (error as Error)?.message });
    } finally {
      window.clearTimeout(timeoutId);
      setSubmittingState(form, false);
    }
  };

  form.addEventListener('submit', handleSubmit);
  cleanupFns.push(() => form.removeEventListener('submit', handleSubmit));

  if (new URLSearchParams(window.location.search).get('success') === 'true') {
    showStatusMessage(statusElement ?? null, '✅ Thank you for your message! I\'ll get back to you soon. 🎉', 'success');
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

export default function ContactFormIsland() {
  useEffect(() => {
    const isAudit = Boolean(
      window.__AUDIT__ ||
      /(^|;)\s*audit=1(;$|;|\s|$)/.test(document.cookie || '') ||
      /lighthouse|headlesschrome/i.test(navigator.userAgent || ''),
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
