export const CONTACT_ERROR_CODES = ['verification', 'rate', 'unavailable', 'invalid'] as const;

export type ContactErrorCode = (typeof CONTACT_ERROR_CODES)[number];

export const CONTACT_ERROR_COPY: Record<ContactErrorCode, string> = {
  verification: 'Complete the verification challenge, then send the brief again.',
  rate: 'Too many attempts just now. Wait a moment, then send the brief again.',
  unavailable: 'The form is unavailable. Email blakepoxford@outlook.com.',
  invalid: 'Check the fields, then send the brief again.',
};

export function isContactErrorCode(value: string): value is ContactErrorCode {
  return (CONTACT_ERROR_CODES as readonly string[]).includes(value);
}
