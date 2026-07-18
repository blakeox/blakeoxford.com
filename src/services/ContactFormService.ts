/**
 * Contact Form Service
 *
 * Service layer for contact form submission.
 * Handles validation, submission, and error handling.
 *
 * @module services/ContactFormService
 */

import { z } from 'zod';
import { AppError, ErrorCodes, createApiErrorFromResponse } from '../utils/errors';

// ─── Types ────────────────────────────────────────────────────────────────────

export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  honeypot: z.string().optional(), // Spam detection field
  turnstileToken: z.string().optional(), // Cloudflare Turnstile token
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;

export interface ContactFormResponse {
  success: boolean;
  message: string;
  id?: string;
}

export interface ContactFormConfig {
  endpoint?: string;
  timeout?: number;
  requireTurnstile?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<ContactFormConfig> = {
  endpoint: '/api/contact',
  timeout: 30000,
  requireTurnstile: true,
};

// ─── Validation Helpers ───────────────────────────────────────────────────────

export type ValidationErrors = Partial<Record<keyof ContactFormData, string>>;

/**
 * Validate contact form data
 */
export function validateContactForm(data: unknown): {
  success: boolean;
  data?: ContactFormData;
  errors?: ValidationErrors;
} {
  const result = ContactFormSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: ValidationErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ContactFormData;
    errors[field] = issue.message;
  }

  return { success: false, errors };
}

// ─── Service Class ────────────────────────────────────────────────────────────

/**
 * Service for handling contact form submissions
 */
export class ContactFormService {
  private config: Required<ContactFormConfig>;

  constructor(config: ContactFormConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Submit a contact form
   */
  async submit(data: ContactFormData): Promise<ContactFormResponse> {
    // Client-side validation
    const validation = validateContactForm(data);
    if (!validation.success) {
      throw new AppError('Validation failed', ErrorCodes.FORM_VALIDATION_ERROR, {
        details: { errors: validation.errors },
        userMessage: 'Please correct the errors in the form.',
      });
    }

    // Honeypot check (spam detection)
    if (data.honeypot && data.honeypot.length > 0) {
      // Silently reject spam submissions
      return {
        success: true,
        message: 'Thank you for your message!',
      };
    }

    // Turnstile check
    if (this.config.requireTurnstile && !data.turnstileToken) {
      throw new AppError('Turnstile verification required', ErrorCodes.FORM_VALIDATION_ERROR, {
        userMessage: 'Please complete the verification challenge.',
      });
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          'cf-turnstile-response': data.turnstileToken,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw await createApiErrorFromResponse(response);
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || 'Thank you for your message!',
        id: result.id,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to submit contact form', ErrorCodes.FORM_SUBMISSION_ERROR, {
        cause: error instanceof Error ? error : undefined,
        isRetryable: true,
      });
    }
  }

  /**
   * Submit a contact form using FormData (for traditional form submissions)
   */
  async submitFormData(
    formData: FormData,
    options?: { signal?: AbortSignal }
  ): Promise<ContactFormResponse> {
    // Extract and validate data from FormData
    const data: Record<string, string> = {
      name: (formData.get('name') as string) || '',
      email: (formData.get('email') as string) || '',
      message: (formData.get('message') as string) || '',
    };

    // Optional fields
    const subject = formData.get('subject') as string;
    if (subject) data.subject = subject;

    const honeypot = formData.get('honeypot') as string;
    if (honeypot) data.honeypot = honeypot;

    const turnstileToken = formData.get('cf-turnstile-response') as string;
    if (turnstileToken) data.turnstileToken = turnstileToken;

    // Client-side validation
    const validation = validateContactForm(data);
    if (!validation.success) {
      throw new AppError('Validation failed', ErrorCodes.FORM_VALIDATION_ERROR, {
        details: { errors: validation.errors },
        userMessage: 'Please correct the errors in the form.',
      });
    }

    // Honeypot check (spam detection)
    if (data.honeypot && data.honeypot.length > 0) {
      // Silently reject spam submissions
      return {
        success: true,
        message: 'Thank you for your message!',
      };
    }

    // Turnstile check
    if (this.config.requireTurnstile && !data.turnstileToken) {
      throw new AppError('Turnstile verification required', ErrorCodes.FORM_VALIDATION_ERROR, {
        userMessage: 'Please complete the verification challenge.',
      });
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
        signal: options?.signal,
      });

      if (!response.ok) {
        throw await createApiErrorFromResponse(response);
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || 'Thank you for your message!',
        id: result.id,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError('Request timed out', ErrorCodes.NETWORK_TIMEOUT, {
          cause: error,
          isRetryable: true,
          userMessage: 'The request timed out. Please try again.',
        });
      }

      throw new AppError('Failed to submit contact form', ErrorCodes.FORM_SUBMISSION_ERROR, {
        cause: error instanceof Error ? error : undefined,
        isRetryable: true,
      });
    }
  }

  /**
   * Validate form data without submitting
   */
  validate(data: unknown): ValidationErrors | null {
    const result = validateContactForm(data);
    return result.success ? null : result.errors || null;
  }

  /**
   * Check if the form service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

let instance: ContactFormService | null = null;

/**
 * Get the singleton contact form service instance
 */
export function getContactFormService(config?: ContactFormConfig): ContactFormService {
  if (!instance || config) {
    instance = new ContactFormService(config);
  }
  return instance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetContactFormService(): void {
  instance = null;
}
