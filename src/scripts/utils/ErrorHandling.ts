/**
 * Enhanced Error Handling and User Feedback System
 * Provides comprehensive error states, validation, and user feedback
 */

// TypeScript interfaces
interface ErrorInfo {
  type: 'javascript' | 'promise' | 'network' | 'resource' | 'validation' | 'form';
  message: string;
  details?: string;
  technical?: string;
  severity: 'error' | 'warning' | 'info';
  timestamp?: string;
  id?: string;
  actions?: UserAction[];
}

interface UserAction {
  label: string;
  action: () => void;
  primary?: boolean;
}



interface ValidationError {
  field: string;
  message: string;
  rule?: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  actions?: UserAction[];
}

export class ErrorHandlingSystem {
  private errorQueue: ErrorInfo[] = [];
  private isShowingError: boolean = false;
  private errorDisplay: HTMLElement | null = null;
  private notificationContainer: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.setupGlobalErrorHandling();
    this.setupFormErrorHandling();
    this.setupNetworkErrorHandling();
    this.setupUserFeedbackSystem();
    this.createErrorDisplay();
  }

  private setupGlobalErrorHandling(): void {
    // Catch JavaScript errors
    window.addEventListener('error', (event: ErrorEvent) => {
      this.handleError({
        type: 'javascript',
        message: 'An unexpected error occurred',
        details: event.error?.message,
        technical: event.error?.stack,
        severity: 'error'
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.handleError({
        type: 'promise',
        message: 'A network or loading error occurred',
        details: event.reason?.toString(),
        severity: 'warning'
      });
    });

    // Resource loading errors
    document.addEventListener('error', (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && target !== (window as unknown as HTMLElement)) {
        this.handleResourceError(target);
      }
    }, true);
  }

  private setupFormErrorHandling(): void {
    document.addEventListener('invalid', (event: Event) => {
      const target = event.target as HTMLFormElement;
      this.handleFieldValidation(target);
    }, true);

    document.addEventListener('submit', (event: Event) => {
      const form = event.target as HTMLFormElement;
      if (form.tagName === 'FORM') {
        this.validateForm(form);
      }
    });
  }

  private setupNetworkErrorHandling(): void {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.handleNetworkError(response);
        }
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.handleError({
          type: 'network',
          message: 'Connection failed. Please check your internet connection.',
          details: errorMessage,
          severity: 'error',
          actions: [
            { label: 'Retry', action: () => window.fetch(...args) },
            { label: 'Refresh Page', action: () => window.location.reload() }
          ]
        });
        throw error;
      }
    };
  }

  private setupUserFeedbackSystem(): void {
    this.setupSuccessFeedback();
    this.setupLoadingStates();
    this.setupConfirmationDialogs();
  }

  public handleError(errorInfo: ErrorInfo): void {
    console.error('Error handled:', errorInfo);
    
    // Add to queue
    this.errorQueue.push({
      ...errorInfo,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substring(2, 11)
    });

    // Show error if not already showing one
    if (!this.isShowingError) {
      this.showNextError();
    }

    // Announce to screen readers
    this.announceError(errorInfo);
  }

  private handleResourceError(element: HTMLElement): void {
    const tagName = element.tagName.toLowerCase();
    let src: string | undefined;
    
    if (element instanceof HTMLImageElement || element instanceof HTMLScriptElement) {
      src = element.src;
    } else if (element instanceof HTMLLinkElement) {
      src = element.href;
    }
    
    let message = 'Failed to load resource';
    let userMessage = 'Some content failed to load';
    let shouldShowError = false;
    
    switch (tagName) {
      case 'img':
        message = `Failed to load image: ${src}`;
        userMessage = 'An image failed to load';
        this.handleImageError(element as HTMLImageElement);
        shouldShowError = false;
        console.warn('Image failed to load:', src);
        break;
      case 'script':
        message = `Failed to load script: ${src}`;
        userMessage = 'A feature may not work properly due to a loading error';
        shouldShowError = !src?.includes('main.js') && !src?.includes('theme-toggle.js');
        break;
      case 'link':
        message = `Failed to load stylesheet: ${src}`;
        userMessage = 'Some styling may not display correctly';
        shouldShowError = !src?.includes('main.css');
        break;
    }

    if (shouldShowError) {
      this.handleError({
        type: 'resource',
        message: userMessage,
        details: message,
        severity: 'warning'
      });
    }
  }

  private handleImageError(img: HTMLImageElement): void {
    const currentSrc = img.src;
    const fallbackImage = '/assets/images/blake-logo-fallback.png';
    
    // Try fallback image first (if not already tried)
    if (!currentSrc.includes('blake-logo-fallback.png') && !img.hasAttribute('data-fallback-tried')) {
      img.setAttribute('data-fallback-tried', 'true');
      img.src = fallbackImage;
      return;
    }
    
    // If fallback also failed, create placeholder
    img.style.display = 'none';
    
    const altText = img.alt || 'Image';
    const placeholder = document.createElement('div');
    placeholder.className = 'image-error-placeholder bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-600';
    
    // Maintain aspect ratio using img dimensions or reasonable defaults
    const width = img.width || img.naturalWidth || 300;
    const height = img.height || img.naturalHeight || 200;
    placeholder.style.width = `${width}px`;
    placeholder.style.height = `${height}px`;
    placeholder.style.minHeight = '120px';
    
    // Add branded logo placeholder
    const logoIcon = document.createElement('div');
    logoIcon.className = 'text-2xl font-bold text-accent mb-2';
    logoIcon.textContent = 'B';
    
    const text = document.createElement('div');
    text.className = 'text-xs text-center px-2';
    text.textContent = altText.includes('Blake') ? 'Blake Oxford Portfolio' : 'Image not available';
    
    placeholder.appendChild(logoIcon);
    placeholder.appendChild(text);
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', altText);
    
    // Insert placeholder where image was
    img.parentNode?.insertBefore(placeholder, img);
    img.remove(); // Remove broken image element completely
  }

  private handleNetworkError(response: Response): void {
    const errorInfo: ErrorInfo = {
      type: 'network',
      message: 'Network request failed',
      details: `HTTP ${response.status}: ${response.statusText}`,
      severity: response.status >= 500 ? 'error' : 'warning',
      actions: [
        { label: 'Retry', action: () => window.location.reload() },
        { label: 'Go Back', action: () => window.history.back() }
      ]
    };

    // Customize message based on status code
    switch (response.status) {
      case 404:
        errorInfo.message = 'Page not found';
        break;
      case 403:
        errorInfo.message = 'Access denied';
        break;
      case 500:
        errorInfo.message = 'Server error';
        break;
      case 503:
        errorInfo.message = 'Service temporarily unavailable';
        break;
    }

    this.handleError(errorInfo);
  }

  private handleFieldValidation(field: HTMLFormElement): void {
    const message = this.getFieldErrorMessage(field);
    this.showFieldError(field, message);
  }

  private validateForm(form: HTMLFormElement): void {
    const errors: ValidationError[] = [];
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach((field) => {
      const element = field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (!element.checkValidity()) {
        errors.push({
          field: element.name || element.id || 'unknown',
          message: element.validationMessage || 'Invalid field',
          rule: element.validationMessage
        });
      }
    });

    if (errors.length > 0) {
      this.showFormErrors(form, errors);
    }
  }

  private showFieldError(field: HTMLFormElement, message: string): void {
    // Remove existing error
    this.clearFieldError(field);
    
    // Add error styling
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
    
    // Create error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error text-red-600 text-sm mt-1';
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');
    
    field.parentNode?.appendChild(errorElement);
    
    // Focus field for accessibility
    field.focus();
  }

  private clearFieldError(field: HTMLFormElement): void {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
    
    const existingError = field.parentNode?.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  private showFormErrors(form: HTMLFormElement, errors: ValidationError[]): void {
    this.handleError({
      type: 'form',
      message: `Form has ${errors.length} error${errors.length > 1 ? 's' : ''}`,
      details: errors.map(e => `${e.field}: ${e.message}`).join(', '),
      severity: 'error',
      actions: [
        { label: 'Fix Errors', action: () => this.focusFirstError(form) }
      ]
    });
  }

  private focusFirstError(form: HTMLFormElement): void {
    const firstError = form.querySelector('.error') as HTMLFormElement;
    if (firstError) {
      firstError.focus();
    }
  }

  private createErrorDisplay(): void {
    this.errorDisplay = document.createElement('div');
    this.errorDisplay.id = 'error-display';
    this.errorDisplay.className = 'fixed top-4 right-4 z-50 max-w-md';
    
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'notification-container';
    this.notificationContainer.className = 'fixed bottom-4 right-4 z-50 space-y-2';
    
    document.body.appendChild(this.errorDisplay);
    document.body.appendChild(this.notificationContainer);
  }

  private showNextError(): void {
    if (this.errorQueue.length === 0 || !this.errorDisplay) return;
    
    const error = this.errorQueue.shift();
    if (!error) return;
    
    this.isShowingError = true;
    
    const errorElement = this.createErrorElement(error);
    this.errorDisplay.appendChild(errorElement);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideError();
    }, 5000);
  }

  private hideError(): void {
    if (!this.errorDisplay) return;
    
    const errorElement = this.errorDisplay.querySelector('.error-item');
    if (errorElement) {
      errorElement.remove();
    }
    
    this.isShowingError = false;
    
    // Show next error if any
    if (this.errorQueue.length > 0) {
      this.showNextError();
    }
  }

  private createErrorElement(error: ErrorInfo): HTMLElement {
    const element = document.createElement('div');
    element.className = 'error-item bg-white dark:bg-gray-800 border-l-4 border-red-500 p-4 rounded shadow-lg';
    
    const severityColors = {
      error: 'border-red-500',
      warning: 'border-yellow-500',
      info: 'border-blue-500'
    };
    
    element.className = `error-item bg-white dark:bg-gray-800 border-l-4 ${severityColors[error.severity]} p-4 rounded shadow-lg`;
    
    element.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">${error.message}</h3>
          ${error.details ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${error.details}</p>` : ''}
          ${error.actions ? `
            <div class="mt-3 space-x-2">
              ${error.actions.map(action => `
                <button class="text-xs px-2 py-1 rounded ${action.primary ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}">
                  ${action.label}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <button class="ml-4 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;
    
    // Add action handlers
    if (error.actions) {
      const buttons = element.querySelectorAll('button');
      error.actions.forEach((action, index) => {
        if (buttons[index + 1]) { // +1 because first button is close button
          buttons[index + 1].addEventListener('click', action.action);
        }
      });
    }
    
    return element;
  }

  private announceError(errorInfo: ErrorInfo): void {
    if (window.accessibilityModule) {
      window.accessibilityModule.announce(errorInfo.message, 'assertive');
    }
  }

  private setupSuccessFeedback(): void {
    // Success feedback for user actions
  }

  private setupLoadingStates(): void {
    // Loading states
  }

  private setupConfirmationDialogs(): void {
    // Confirmation dialogs
  }

  public showSuccess(message: string): void {
    this.showNotification({
      id: Math.random().toString(36).substring(2, 11),
      message,
      type: 'success',
      duration: 3000
    });
  }

  public showLoading(): void {
    // Implementation for loading states
  }

  public hideLoading(): void {
    // Implementation for hiding loading states
  }

  private createNotification(notification: Notification): HTMLElement {
    const element = document.createElement('div');
    element.className = 'notification bg-white dark:bg-gray-800 border-l-4 p-4 rounded shadow-lg';
    
    const typeColors = {
      success: 'border-green-500',
      error: 'border-red-500',
      warning: 'border-yellow-500',
      info: 'border-blue-500'
    };
    
    element.className = `notification bg-white dark:bg-gray-800 border-l-4 ${typeColors[notification.type]} p-4 rounded shadow-lg`;
    
    element.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <p class="text-sm text-gray-900 dark:text-gray-100">${notification.message}</p>
        </div>
        <button class="ml-4 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;
    
    return element;
  }

  private showNotification(notification: Notification): void {
    if (!this.notificationContainer) return;
    
    const element = this.createNotification(notification);
    this.notificationContainer.appendChild(element);
    
    if (notification.duration) {
      setTimeout(() => {
        element.remove();
      }, notification.duration);
    }
  }

  private getFieldLabel(field: HTMLFormElement): string {
    const label = field.labels?.[0]?.textContent;
    const placeholder = field.getAttribute('placeholder');
    const ariaLabel = field.getAttribute('aria-label');
    const name = field.name || field.id;
    
    return label || placeholder || ariaLabel || name || 'Field';
  }

  private getFieldErrorMessage(field: HTMLFormElement): string {
    const label = this.getFieldLabel(field);
    
    if (field.validity.valueMissing) {
      return `${label} is required`;
    }
    
    if (field.validity.typeMismatch) {
      if (field.type === 'email') {
        return `${label} must be a valid email address`;
      }
      if (field.type === 'url') {
        return `${label} must be a valid URL`;
      }
    }
    
    if (field.validity.tooShort) {
      return `${label} must be at least ${field.minLength} characters`;
    }
    
    if (field.validity.tooLong) {
      return `${label} must be no more than ${field.maxLength} characters`;
    }
    
    if (field.validity.patternMismatch) {
      return `${label} format is invalid`;
    }
    
    return field.validationMessage || `${label} is invalid`;
  }
}

// Initialize error handling system
export function initErrorHandlingSystem(): ErrorHandlingSystem {
  console.log('🚀 Initializing ErrorHandlingSystem...');
  return new ErrorHandlingSystem();
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      (window as Window & { errorHandlingSystem?: ErrorHandlingSystem }).errorHandlingSystem = initErrorHandlingSystem();
    });
  } else {
    (window as Window & { errorHandlingSystem?: ErrorHandlingSystem }).errorHandlingSystem = initErrorHandlingSystem();
  }
} 