/**
 * Tests for ContactFormService
 * 
 * @module tests/vitest/services/ContactFormService.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	ContactFormService,
	validateContactForm,
	getContactFormService,
	resetContactFormService,
	type ContactFormData,
} from '../../../src/services/ContactFormService';

describe('ContactFormService', () => {
	beforeEach(() => {
		resetContactFormService();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('validateContactForm', () => {
		it('validates valid form data', () => {
			const data: ContactFormData = {
				name: 'John Doe',
				email: 'john@example.com',
				subject: 'Test Subject',
				message: 'This is a test message that is long enough',
			};

			const result = validateContactForm(data);
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});

		it('rejects empty name', () => {
			const data: ContactFormData = {
				name: '',
				email: 'john@example.com',
				subject: 'Test Subject',
				message: 'This is a test message',
			};

			const result = validateContactForm(data);
			expect(result.success).toBe(false);
			expect(result.errors?.name).toBeDefined();
		});

		it('rejects invalid email', () => {
			const data: ContactFormData = {
				name: 'John Doe',
				email: 'not-an-email',
				subject: 'Test Subject',
				message: 'This is a test message',
			};

			const result = validateContactForm(data);
			expect(result.success).toBe(false);
			expect(result.errors?.email).toBeDefined();
		});

		it('rejects short message', () => {
			const data: ContactFormData = {
				name: 'John Doe',
				email: 'john@example.com',
				subject: 'Test Subject',
				message: 'Hi', // Too short
			};

			const result = validateContactForm(data);
			expect(result.success).toBe(false);
			expect(result.errors?.message).toBeDefined();
		});

		it('allows honeypot field in schema (spam checked on submit)', () => {
			const data: ContactFormData = {
				name: 'John Doe',
				email: 'john@example.com',
				subject: 'Test Subject',
				message: 'This is a test message',
				honeypot: 'spam content',
			};

			// Schema allows honeypot - spam detection happens on submit
			const result = validateContactForm(data);
			expect(result.success).toBe(true);
		});
	});

	describe('ContactFormService', () => {
		it('creates instance with default config', () => {
			const service = new ContactFormService();
			expect(service).toBeDefined();
		});

		it('creates instance with custom config', () => {
			const service = new ContactFormService({
				endpoint: '/custom/endpoint',
				timeout: 5000,
				requireTurnstile: false,
			});
			expect(service).toBeDefined();
		});

		it('throws validation error for invalid data', async () => {
			const service = new ContactFormService({ requireTurnstile: false });
			
			const invalidData: ContactFormData = {
				name: '',
				email: 'not-valid',
				subject: '',
				message: 'hi',
			};

			await expect(service.submit(invalidData)).rejects.toThrow('Validation failed');
		});

		it('handles API success', async () => {
			global.fetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true, message: 'Email sent!' }),
			});

			const service = new ContactFormService({ requireTurnstile: false });
			
			const validData: ContactFormData = {
				name: 'John Doe',
				email: 'john@example.com',
				subject: 'Test Subject',
				message: 'This is a valid test message that is long enough',
			};

			const result = await service.submit(validData);
			expect(result.success).toBe(true);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it('handles API error', async () => {
			global.fetch = vi.fn().mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: () => Promise.resolve('Server error'),
			});

			const service = new ContactFormService({ requireTurnstile: false });
			
			const validData: ContactFormData = {
				name: 'John Doe',
				email: 'john@example.com',
				subject: 'Test Subject',
				message: 'This is a valid test message that is long enough',
			};

			await expect(service.submit(validData)).rejects.toThrow();
		});

		it('handles network error', async () => {
			global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

			const service = new ContactFormService({ requireTurnstile: false });
			
			const validData: ContactFormData = {
				name: 'John Doe',
				email: 'john@example.com',
				subject: 'Test Subject',
				message: 'This is a valid test message that is long enough',
			};

			await expect(service.submit(validData)).rejects.toThrow('Failed to submit contact form');
		});

		it('requires Turnstile when configured', async () => {
			const service = new ContactFormService({ requireTurnstile: true });
			
			const validData: ContactFormData = {
				name: 'John Doe',
				email: 'john@example.com',
				subject: 'Test Subject',
				message: 'This is a valid test message that is long enough',
			};

			await expect(service.submit(validData)).rejects.toThrow('Turnstile verification required');
		});
	});

	describe('getContactFormService', () => {
		it('returns singleton instance', () => {
			const instance1 = getContactFormService();
			const instance2 = getContactFormService();
			expect(instance1).toBe(instance2);
		});

		it('creates new instance after reset', () => {
			const instance1 = getContactFormService();
			resetContactFormService();
			const instance2 = getContactFormService();
			expect(instance1).not.toBe(instance2);
		});
	});
});
