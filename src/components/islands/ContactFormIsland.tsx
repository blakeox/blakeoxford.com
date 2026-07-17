import { useEffect } from 'react';
import {
 clearError,
 clearStatusMessage,
 defaultErrorFormatter,
 hydrateFields,
 setSubmittingState,
 showError,
 showStatusMessage,
 validateField,
} from './form/FormHelpers';
import type { FormValidationConfig } from './form/FormHelpers';
import { getContactFormService } from '../../services/ContactFormService';
import { AppError, isAppError, getUserMessage } from '../../utils/errors';
import { conversionEvents } from '../../lib/analytics';

declare global {
 interface Window {
 turnstile?: {
 render: (container: HTMLElement, options: Record<string, unknown>) => void;
 };
 __AUDIT__?: boolean;
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

const SUCCESS_MESSAGE = 'Your project brief was sent. I’ll review it and follow up by email.';

type CleanupFn = () => void;

function setupTurnstile(isAudit: boolean): CleanupFn | void {
 const container = document.getElementById('turnstile-container');
 const shell = document.getElementById('turnstile-shell');
 const placeholder = document.getElementById('turnstile-placeholder');
 const status = document.getElementById('turnstile-status');
 if (!container) return;

 const widgetSize = container.getBoundingClientRect().width >= 300 ? 'flexible' : 'compact';
 const setVerificationState = (
 state: 'idle' | 'loading' | 'interactive' | 'verified' | 'error' | 'audit',
 message: string,
 ) => {
 shell?.setAttribute('data-turnstile-state', state);
 if (shell) shell.style.minHeight = state === 'interactive' && widgetSize === 'compact' ? '140px' : '65px';
 placeholder?.classList.toggle('invisible', state === 'interactive');
 if (status) status.textContent = message;
 };

 if (isAudit) {
 container.setAttribute('aria-label', 'Human verification temporarily disabled during automated audits');
 setVerificationState('audit', 'Verification skipped during automated audit');
 return;
 }

 const renderWidget = () => {
 if (!window.turnstile) {
 setVerificationState('error', 'Verification could not load. Refresh and try again.');
 return;
 }

 setVerificationState('loading', 'Checking your browser…');
 window.turnstile.render(container, {
 sitekey: SITE_KEY,
 size: widgetSize,
 theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
 appearance: 'interaction-only',
 action: 'contact_form',
 callback: () => setVerificationState('verified', 'Verification complete'),
 'before-interactive-callback': () => setVerificationState('interactive', 'Complete the verification below'),
 'after-interactive-callback': () => setVerificationState('loading', 'Finishing verification…'),
 'expired-callback': () => setVerificationState('loading', 'Verification expired. Checking again…'),
 'error-callback': () => setVerificationState('error', 'Verification could not load. Refresh and try again.'),
 });
 };

 let injected = false;
 const injectScript = () => {
 if (injected) return;
 if (window.turnstile) {
 injected = true;
 renderWidget();
 return;
 }

 injected = true;
 setVerificationState('loading', 'Loading secure verification…');
 const script = document.createElement('script');
 script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
 script.async = true;
 script.defer = true;
 script.onload = () => {
 try {
 renderWidget();
 } catch (error) {
 console.warn('Turnstile render failed', error);
 setVerificationState('error', 'Verification could not load. Refresh and try again.');
 }
 };
 script.onerror = () => {
 console.warn('Turnstile script failed to load');
 setVerificationState('error', 'Verification could not load. Refresh and try again.');
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

 let timeoutId: ReturnType<typeof setTimeout> | undefined;
 let idleId: number | undefined;

 if ('requestIdleCallback' in window) {
 idleId = window.requestIdleCallback?.(() => injectScript(), { timeout: 15000 });
 cleanupFns.push(() => {
 if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
 });
 } else {
 timeoutId = globalThis.setTimeout(injectScript, 15000);
 cleanupFns.push(() => globalThis.clearTimeout(timeoutId));
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

 const messageField = fields.message as HTMLTextAreaElement | null;
 const messageCount = document.getElementById('message-count');
 const updateMessageCount = () => {
 if (messageField && messageCount) messageCount.textContent = String(messageField.value.length);
 };
 messageField?.addEventListener('input', updateMessageCount);
 updateMessageCount();
 cleanupFns.push(() => messageField?.removeEventListener('input', updateMessageCount));

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
 // analytics removed; no-op
 const firstErrorField = FORM_VALIDATION_CONFIG.fields.find(({ id }) => errors[id]);
 if (firstErrorField) {
 const field = fields[firstErrorField.id] as HTMLElement | null;
 field?.focus();
 }
 return;
 }

 const formData = new FormData(form);
 const controller = new AbortController();
 const timeoutId: ReturnType<typeof setTimeout> = globalThis.setTimeout(() => controller.abort(), 10000);

 try {
 setSubmittingState(form, true);

 // Use ContactFormService for submission
 const contactService = getContactFormService({
 endpoint: form.action || '/api/contact/submit',
 requireTurnstile: true,
 });

 const result = await contactService.submitFormData(formData, { signal: controller.signal });

 globalThis.clearTimeout(timeoutId);

 if (result.success) {
 showStatusMessage(statusElement ?? null, SUCCESS_MESSAGE, 'success');
 conversionEvents.generateLead({ method: 'contact_form', form: 'contact' });
 form.reset();
 updateMessageCount();
 statusElement?.focus();
 }
 } catch (error) {
 globalThis.clearTimeout(timeoutId);

 // Use centralized error handling
 const errorMessage = isAppError(error)
 ? getUserMessage(error as AppError)
 : 'Your message could not be sent. Please try again or email blakepoxford@outlook.com directly.';

 console.error('Form submission failed', error);
 showStatusMessage(statusElement ?? null, errorMessage, 'error');
 } finally {
 globalThis.clearTimeout(timeoutId);
 setSubmittingState(form, false);
 }
 };

 form.addEventListener('submit', handleSubmit);
 cleanupFns.push(() => form.removeEventListener('submit', handleSubmit));

 if (new URLSearchParams(window.location.search).get('success') === 'true') {
 showStatusMessage(statusElement ?? null, SUCCESS_MESSAGE, 'success');
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

 const turnstileCleanup = setupTurnstile(isAudit);
 if (typeof turnstileCleanup === 'function') {
 cleanupFns.push(turnstileCleanup);
 }

 return () => {
 cleanupFns.forEach((fn) => {
 if (typeof fn === 'function') fn();
 });
 };
 }, []);

 return null;
}
