import { describe, expect, it } from 'vitest';
import { contactSubmissionFailure } from '../../src/features/contact/ContactFormIsland';
import { AppError, ErrorCodes } from '../../src/utils/errors';

describe('contactSubmissionFailure', () => {
  it('classifies a server-rejected Turnstile token as turnstile', () => {
    const error = new AppError('Bot verification failed.', ErrorCodes.API_FORBIDDEN, {
      details: { status: 403 },
      userMessage: "You don't have permission to access this.",
    });

    expect(contactSubmissionFailure(error)).toEqual({
      reason: 'turnstile',
      message: 'Verification failed. Complete the check and try again.',
    });
  });

  it('keeps an unavailable contact service on network', () => {
    const error = new AppError('Contact service unavailable.', ErrorCodes.API_SERVER_ERROR, {
      details: { status: 503 },
    });

    expect(contactSubmissionFailure(error)).toEqual({
      reason: 'network',
      message:
        'Your message could not be sent. Please try again or email blakepoxford@outlook.com directly.',
    });
  });
  it('retains a rate limit recovery instruction', () => {
    const error = new AppError('Rate limited.', ErrorCodes.API_SERVER_ERROR, {
      details: { status: 429 },
    });
    expect(contactSubmissionFailure(error).message).toBe(
      'Too many attempts just now. Wait a moment, then send the brief again.'
    );
  });
});
