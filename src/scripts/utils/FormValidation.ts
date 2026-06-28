/**
 * Form Validation Module - TypeScript version
 * Provides comprehensive form validation with accessibility support
 */

interface ValidationRule {
  pattern?: RegExp;
  validate?: (value: string, param?: number | string) => boolean;
  message: string | ((param?: number | string) => string);
}

interface FieldData {
  element: HTMLElement;
  isValid: boolean;
  errors: string[];
}

interface FormData {
  element: HTMLFormElement;
  fields: Map<string, FieldData>;
  isValid: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface FormValidationConfig {
  enableRealTime?: boolean;
  enableAccessibility?: boolean;
  showErrorsImmediately?: boolean;
  customRules?: Map<string, ValidationRule>;
}

export class FormValidation {
  private forms: Map<string, FormData> = new Map();
  private validationRules: Map<string, ValidationRule> = new Map();
  private errorMessages: Map<string, string> = new Map();
  private config: FormValidationConfig;

  constructor(config: FormValidationConfig = {}) {
    this.config = {
      enableRealTime: true,
      enableAccessibility: true,
      showErrorsImmediately: false,
      customRules: new Map(),
      ...config
    };
    
    this.init();
  }

  private init(): void {
    this.setupDefaultValidationRules();
    this.setupDefaultErrorMessages();
    this.scanForForms();
    this.setupGlobalFormHandlers();
    
    // Mark as loaded in lazy loader
    if (typeof window !== 'undefined' && window.LazyBundleLoader) {
      window.LazyBundleLoader.markModuleLoaded('forms');
    }
  }

  private setupDefaultValidationRules(): void {
    this.validationRules.set('email', {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    });

    this.validationRules.set('phone', {
      pattern: /^[+]?[1-9][\d]{0,15}$/,
      message: 'Please enter a valid phone number'
    });

    this.validationRules.set('required', {
      validate: (value: string) => value.trim().length > 0,
      message: 'This field is required'
    });

    this.validationRules.set('minLength', {
      validate: (value: string, param?: string | number) => {
        const min = typeof param === 'number' ? param : parseInt(param as string) || 0;
        return value.length >= min;
      },
      message: (param?: string | number) => {
        const min = typeof param === 'number' ? param : parseInt(param as string) || 0;
        return `Must be at least ${min} characters`;
      }
    });

    this.validationRules.set('maxLength', {
      validate: (value: string, param?: string | number) => {
        const max = typeof param === 'number' ? param : parseInt(param as string) || 0;
        return value.length <= max;
      },
      message: (param?: string | number) => {
        const max = typeof param === 'number' ? param : parseInt(param as string) || 0;
        return `Must be no more than ${max} characters`;
      }
    });

    this.validationRules.set('url', {
      pattern: /^https?:\/\/.+/,
      message: 'Please enter a valid URL'
    });

    // Add custom rules from config
    if (this.config.customRules) {
      this.config.customRules.forEach((rule, name) => {
        this.validationRules.set(name, rule);
      });
    }
  }

  private setupDefaultErrorMessages(): void {
    this.errorMessages.set('email', 'Please enter a valid email address');
    this.errorMessages.set('required', 'This field is required');
    this.errorMessages.set('phone', 'Please enter a valid phone number');
    this.errorMessages.set('url', 'Please enter a valid URL');
  }

  private scanForForms(): void {
    const forms = document.querySelectorAll<HTMLFormElement>('form[data-validate]');
    forms.forEach(form => this.registerForm(form));
  }

  public registerForm(form: HTMLFormElement): void {
    const formId = form.id || `form-${Date.now()}`;
    this.forms.set(formId, {
      element: form,
      fields: new Map(),
      isValid: true
    });

    this.setupFormValidation(form, formId);
  }

  private setupFormValidation(form: HTMLFormElement, formId: string): void {
    const formData = this.forms.get(formId);
    if (!formData) return;
    
    // Setup field validation
    const fields = form.querySelectorAll<HTMLElement>('input, textarea, select');
    fields.forEach(field => this.setupFieldValidation(field, formId));

    // Setup form submission
    form.addEventListener('submit', (e: Event) => this.handleFormSubmit(e, formId));
    
    // Setup real-time validation
    if (this.config.enableRealTime) {
      form.addEventListener('input', (e: Event) => this.handleFieldInput(e, formId));
      form.addEventListener('blur', (e: Event) => this.handleFieldBlur(e, formId), true);
    }
  }

  private setupFieldValidation(field: HTMLElement, formId: string): void {
    const formData = this.forms.get(formId);
    if (!formData) return;
    
    const fieldId = field.id || (field as HTMLInputElement).name || `field-${Date.now()}`;
    
    formData.fields.set(fieldId, {
      element: field,
      isValid: true,
      errors: []
    });

    // Parse validation attributes
    const validations = this.parseValidationAttributes(field);
    field.dataset.validations = JSON.stringify(validations);
  }

  private parseValidationAttributes(field: HTMLElement): Array<{type: string; value?: unknown}> {
    const validations: Array<{type: string; value?: unknown}> = [];
    
    if (field.hasAttribute('required')) {
      validations.push({ type: 'required' });
    }
    
    if (field.hasAttribute('minlength')) {
      validations.push({ 
        type: 'minLength', 
        value: parseInt(field.getAttribute('minlength') || '0') 
      });
    }
    
    if (field.hasAttribute('maxlength')) {
      validations.push({ 
        type: 'maxLength', 
        value: parseInt(field.getAttribute('maxlength') || '0') 
      });
    }
    
    const inputField = field as HTMLInputElement;
    if (inputField.type === 'email') {
      validations.push({ type: 'email' });
    }
    
    if (inputField.type === 'url') {
      validations.push({ type: 'url' });
    }
    
    if (inputField.type === 'tel') {
      validations.push({ type: 'phone' });
    }
    
    // Custom validation attributes
    if (field.hasAttribute('data-validate')) {
      const customValidations = field.getAttribute('data-validate')?.split(',') || [];
      customValidations.forEach(validation => {
        const [type, value] = validation.trim().split(':');
        validations.push({ type, value });
      });
    }
    
    return validations;
  }

  public validateField(field: HTMLElement, formId: string): ValidationResult {
    const formData = this.forms.get(formId);
    if (!formData) return { isValid: false, errors: ['Form not found'] };

    const fieldId = field.id || (field as HTMLInputElement).name || '';
    const fieldData = formData.fields.get(fieldId);
    if (!fieldData) return { isValid: false, errors: ['Field not found'] };

    const value = (field as HTMLInputElement).value || '';
    const validations = this.parseValidationAttributes(field);
    const errors: string[] = [];

    validations.forEach(validation => {
      const rule = this.validationRules.get(validation.type);
      if (!rule) return;

      let isValid = true;

      if (rule.pattern) {
        isValid = rule.pattern.test(value);
      } else if (rule.validate) {
        isValid = rule.validate(value, validation.value as string | number);
      }

      if (!isValid) {
        const message = typeof rule.message === 'function' 
          ? rule.message(validation.value as string | number)
          : rule.message;
        errors.push(message);
      }
    });

    const isValid = errors.length === 0;
    
    // Update field data
    fieldData.isValid = isValid;
    fieldData.errors = errors;

    // Update UI
    this.updateFieldUI(field, isValid, errors);

    return { isValid, errors };
  }

  private updateFieldUI(field: HTMLElement, isValid: boolean, errors: string[]): void {
    // Remove existing error styling
    field.classList.remove('error', 'valid');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');

    // Remove existing error messages
    const existingError = field.parentNode?.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    if (!isValid && errors.length > 0) {
      // Add error styling
      field.classList.add('error');
      field.setAttribute('aria-invalid', 'true');

      // Create error message
      const errorElement = document.createElement('div');
      errorElement.className = 'field-error text-error text-sm mt-1';
      errorElement.textContent = errors[0];
      errorElement.setAttribute('role', 'alert');
      errorElement.id = `error-${field.id || Date.now()}`;

      field.setAttribute('aria-describedby', errorElement.id);
      field.parentNode?.appendChild(errorElement);

      // Announce to screen reader
      if (this.config.enableAccessibility) {
        this.announceToScreenReader(errors[0]);
      }
    } else if (isValid && (field as HTMLInputElement).value) {
      // Add valid styling
      field.classList.add('valid');
    }
  }

  private handleFieldInput(e: Event, formId: string): void {
    const target = e.target as HTMLElement;
    if (this.config.showErrorsImmediately) {
      this.validateField(target, formId);
    }
  }

  private handleFieldBlur(e: Event, formId: string): void {
    const target = e.target as HTMLElement;
    this.validateField(target, formId);
  }

  private handleFormSubmit(e: Event, formId: string): void {
    e.preventDefault();
    
    const formData = this.forms.get(formId);
    if (!formData) return;

    const isValid = this.validateForm(formId);
    
    if (isValid) {
      this.showFormSuccess(formData.element);
      this.submitForm(formData.element);
    } else {
      this.showFormErrors(formData.element, formId);
    }
  }

  private showFormErrors(form: HTMLFormElement, formId: string): void {
    const formData = this.forms.get(formId);
    if (!formData) return;

    // Show all field errors
    formData.fields.forEach((fieldData) => {
      this.validateField(fieldData.element, formId);
    });

    // Announce to screen reader
    if (this.config.enableAccessibility) {
      this.announceToScreenReader('Form has errors. Please check the highlighted fields.');
    }

    // Focus first error field
    const firstErrorField = form.querySelector('.error') as HTMLElement;
    if (firstErrorField) {
      firstErrorField.focus();
    }
  }

  private showFormSuccess(form: HTMLFormElement): void {
    // Add success styling
    form.classList.add('form-success');
    
    // Announce to screen reader
    if (this.config.enableAccessibility) {
      this.announceToScreenReader('Form submitted successfully.');
    }
  }

  private submitForm(form: HTMLFormElement): void {
    // Get form data
    const formData = new FormData(form);
    
    // Submit form (you can customize this for your needs)
    fetch(form.action, {
      method: form.method || 'POST',
      body: formData
    })
    .then(response => {
      if (response.ok) {
        console.log('Form submitted successfully');
      } else {
        throw new Error('Form submission failed');
      }
    })
    .catch(error => {
      console.error('Form submission error:', error);
      this.announceToScreenReader('Form submission failed. Please try again.');
    });
  }

  private setupGlobalFormHandlers(): void {
    // Handle form reset
    document.addEventListener('reset', (e: Event) => {
      const form = e.target as HTMLFormElement;
      const formId = form.id;
      if (formId && this.forms.has(formId)) {
        this.resetForm(formId);
      }
    });

    // Handle dynamic form additions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const forms = element.querySelectorAll<HTMLFormElement>('form[data-validate]');
            forms.forEach(form => this.registerForm(form));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  public validateForm(formId: string): boolean {
    const formData = this.forms.get(formId);
    if (!formData) return false;

    let isValid = true;

    formData.fields.forEach((fieldData) => {
      const fieldResult = this.validateField(fieldData.element, formId);
      if (!fieldResult.isValid) {
        isValid = false;
      }
    });

    formData.isValid = isValid;
    return isValid;
  }

  public resetForm(formId: string): void {
    const formData = this.forms.get(formId);
    if (!formData) return;

    formData.fields.forEach((fieldData) => {
      fieldData.isValid = true;
      fieldData.errors = [];
      this.updateFieldUI(fieldData.element, true, []);
    });

    formData.isValid = true;
    formData.element.classList.remove('form-success');
  }

  public addValidationRule(name: string, rule: ValidationRule): void {
    this.validationRules.set(name, rule);
  }

  public setErrorMessage(type: string, message: string): void {
    this.errorMessages.set(type, message);
  }

  private announceToScreenReader(message: string): void {
    if (typeof window !== 'undefined' && window.accessibilityModule) {
      window.accessibilityModule.announce(message, 'assertive');
    }
  }

  public getFormData(formId: string): FormData | undefined {
    return this.forms.get(formId);
  }

  public getValidationRules(): Map<string, ValidationRule> {
    return new Map(this.validationRules);
  }

  public updateConfig(newConfig: Partial<FormValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Initialize form validation
export function initFormValidation(config?: FormValidationConfig): FormValidation {
  console.log('🚀 Initializing FormValidation...');
  return new FormValidation(config);
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      (window as Window & { formValidation?: FormValidation }).formValidation = initFormValidation();
    });
  } else {
    (window as Window & { formValidation?: FormValidation }).formValidation = initFormValidation();
  }
} 
