type FieldMetadata = {
  label: string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  required?: boolean;
  transform?: (value: string) => string;
  customValidator?: (value: string) => string | null;
};

export type FormFieldConfig = {
  id: string;
  name?: string;
  inputSelector?: string;
  textarea?: boolean;
  metadata: FieldMetadata;
};

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

export type FormValidationConfig = {
  fields: FormFieldConfig[];
  submitButtonSelector?: string;
  statusElementSelector?: string;
};

export function hydrateFields(form: HTMLFormElement, config: FormValidationConfig): Record<string, HTMLElement | null> {
  return config.fields.reduce<Record<string, HTMLElement | null>>((accumulator, field) => {
    const selector = field.inputSelector ?? `#${field.id}`;
    accumulator[field.id] = form.querySelector(selector);
    return accumulator;
  }, {});
}

export function defaultErrorFormatter(label: string, message: string): string {
  return `${label} ${message}`;
}

export function getFieldLabel(field: HTMLElement, fallback: string): string {
  const labels =
    'labels' in field ? ((field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).labels ?? []) : [];
  const labelArray = Array.from(labels);
  if (labelArray.length > 0) {
    const raw = labelArray[0]?.textContent ?? '';
    return raw.replace('*', '').trim() || fallback;
  }
  const ariaLabel = field.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.trim();
  const name = field.getAttribute('name');
  return name ?? fallback;
}

export function validateField(
  field: HTMLInputElement | HTMLTextAreaElement,
  metadata: FieldMetadata
): string | null {
  const value = metadata.transform ? metadata.transform(field.value) : field.value.trim();

  if (metadata.required && value.length === 0) {
    return 'is required and cannot be empty.';
  }

  if (metadata.minLength && value.length > 0 && value.length < metadata.minLength) {
    return `must be at least ${metadata.minLength} characters long.`;
  }

  if (metadata.maxLength && value.length > metadata.maxLength) {
    return `must be ${metadata.maxLength} characters or fewer.`;
  }

  if (metadata.pattern && value.length > 0 && !metadata.pattern.test(value)) {
    return 'is not in the correct format.';
  }

  if (metadata.customValidator) {
    const customMessage = metadata.customValidator(value);
    if (customMessage) {
      return customMessage;
    }
  }

  return null;
}

export function showError(field: HTMLElement, message: string): void {
  const errorContainer = document.getElementById(`${field.id}-error`);
  field.setAttribute('aria-invalid', 'true');
  field.classList.add('border-error');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
  }
}

export function clearError(field: HTMLElement): void {
  const errorContainer = document.getElementById(`${field.id}-error`);
  field.setAttribute('aria-invalid', 'false');
  field.classList.remove('border-error');
  if (errorContainer) {
    errorContainer.textContent = '';
    errorContainer.classList.add('hidden');
  }
}

export function setSubmittingState(form: HTMLFormElement, isSubmitting: boolean): void {
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const buttonLabel = submitButton?.querySelector<HTMLElement>('#btn-label');
  const spinner = submitButton?.querySelector<HTMLElement>('#spinner');

  if (!submitButton) return;

  submitButton.disabled = isSubmitting;

  if (buttonLabel) {
    buttonLabel.textContent = isSubmitting ? 'Sending securely…' : 'Send project brief';
  }

  if (spinner) {
    spinner.classList.toggle('hidden', !isSubmitting);
  }
}

export function showStatusMessage(
  element: HTMLElement | null,
  message: string,
  type: 'success' | 'error'
): void {
  if (!element) return;

  element.textContent = message;
  element.classList.remove('hidden');

  if (type === 'success') {
    element.classList.remove('text-error', 'bg-error/8', 'border-error/30');
    element.classList.add('text-success-dark', 'bg-success/10', 'border', 'border-success/30', 'rounded-xl', 'p-4');
  } else {
    element.classList.remove('text-success-dark', 'bg-success/10', 'border-success/30');
    element.classList.add('text-error', 'bg-error/8', 'border', 'border-error/30', 'rounded-xl', 'p-4');
  }
}

export function clearStatusMessage(element: HTMLElement | null): void {
  if (!element) return;
  element.textContent = '';
  element.classList.add('hidden');
  element.classList.remove('text-success-dark', 'bg-success/10', 'border', 'border-success/30', 'rounded-xl', 'p-4', 'text-error', 'bg-error/8', 'border-error/30');
}
