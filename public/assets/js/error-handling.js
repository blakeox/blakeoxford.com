/**
 * Enhanced Error Handling and User Feedback System
 * Provides comprehensive error states, validation, and user feedback
 */

export class ErrorHandlingSystem {
  constructor() {
    this.errorQueue = [];
    this.isShowingError = false;
    this.init();
  }

  init() {
    this.setupGlobalErrorHandling();
    this.setupFormErrorHandling();
    this.setupNetworkErrorHandling();
    this.setupUserFeedbackSystem();
    this.createErrorDisplay();
  }

  setupGlobalErrorHandling() {
    // Catch JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: 'An unexpected error occurred',
        details: event.error?.message,
        technical: event.error?.stack,
        severity: 'error'
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise',
        message: 'A network or loading error occurred',
        details: event.reason,
        severity: 'warning'
      });
    });

    // Resource loading errors
    document.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleResourceError(event.target);
      }
    }, true);
  }

  setupFormErrorHandling() {
    document.addEventListener('invalid', (event) => {
      this.handleFieldValidation(event.target);
    }, true);

    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        this.validateForm(form);
      }
    });
  }

  setupNetworkErrorHandling() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.handleNetworkError(response);
        }
        
        return response;
      } catch (error) {
        this.handleError({
          type: 'network',
          message: 'Connection failed. Please check your internet connection.',
          details: error.message,
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

  setupUserFeedbackSystem() {
    // Success feedback for user actions
    this.setupSuccessFeedback();
    
    // Loading states
    this.setupLoadingStates();
    
    // Confirmation dialogs
    this.setupConfirmationDialogs();
  }

  handleError(errorInfo) {
    console.error('Error handled:', errorInfo);
    
    // Add to queue
    this.errorQueue.push({
      ...errorInfo,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    });

    // Show error if not already showing one
    if (!this.isShowingError) {
      this.showNextError();
    }

    // Announce to screen readers
    this.announceError(errorInfo);
  }

  handleResourceError(element) {
    const tagName = element.tagName.toLowerCase();
    const src = element.src || element.href;
    
    let message = 'Failed to load resource';
    let userMessage = 'Some content failed to load';
    let shouldShowError = true;
    
    switch (tagName) {
      case 'img':
        message = `Failed to load image: ${src}`;
        userMessage = 'An image failed to load';
        this.handleImageError(element);
        // Don't show popup errors for missing images - just handle gracefully
        shouldShowError = false;
        console.warn('Image failed to load:', src);
        break;
      case 'script':
        message = `Failed to load script: ${src}`;
        userMessage = 'A feature may not work properly due to a loading error';
        break;
      case 'link':
        message = `Failed to load stylesheet: ${src}`;
        userMessage = 'Some styling may not display correctly';
        break;
    }

    // Only show error popups for critical resources (scripts, stylesheets)
    if (shouldShowError) {
      this.handleError({
        type: 'resource',
        message: userMessage,
        details: message,
        severity: 'warning'
      });
    }
  }

  handleImageError(img) {
    // Try fallback image first
    const currentSrc = img.src;
    const fallbackImage = '/assets/images/blake-logo-fallback.png';
    
    // If we're not already trying the fallback and this isn't the fallback failing
    if (!currentSrc.includes('blake-logo-fallback.png') && !img.hasAttribute('data-fallback-tried')) {
      img.setAttribute('data-fallback-tried', 'true');
      img.src = fallbackImage;
      return;
    }
    
    // If fallback also failed, create a graceful placeholder
    img.style.display = 'none';
    
    // Add accessible alternative with branded styling
    const altText = img.alt || 'Project image';
    const placeholder = document.createElement('div');
    placeholder.className = 'image-error-placeholder bg-white dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 text-sm border-2 border-gray-200 dark:border-gray-600';
    placeholder.style.width = img.style.width || '100%';
    placeholder.style.height = img.style.height || '200px';
    placeholder.style.minHeight = '150px';
    
    // Create branded placeholder content
    const logoIcon = document.createElement('div');
    logoIcon.className = 'text-4xl font-bold text-blue-600 mb-2';
    logoIcon.textContent = 'B';
    
    const text = document.createElement('div');
    text.textContent = 'Blake Oxford Portfolio';
    
    placeholder.appendChild(logoIcon);
    placeholder.appendChild(text);
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', altText);
    
    img.parentNode.insertBefore(placeholder, img);
  }

  handleNetworkError(response) {
    let message = 'Network error occurred';
    
    switch (response.status) {
      case 404:
        message = 'The requested content was not found';
        break;
      case 500:
        message = 'Server error occurred. Please try again later.';
        break;
      case 503:
        message = 'Service temporarily unavailable';
        break;
      default:
        message = `Network error (${response.status}): ${response.statusText}`;
    }

    this.handleError({
      type: 'network',
      message,
      severity: 'error',
      status: response.status
    });
  }

  handleFieldValidation(field) {
    const fieldName = this.getFieldLabel(field);
    let message = field.validationMessage;
    
    // Provide more helpful messages
    if (field.validity.valueMissing) {
      message = `${fieldName} is required`;
    } else if (field.validity.typeMismatch) {
      if (field.type === 'email') {
        message = `Please enter a valid email address`;
      } else if (field.type === 'url') {
        message = `Please enter a valid URL`;
      }
    } else if (field.validity.tooShort) {
      message = `${fieldName} must be at least ${field.minLength} characters`;
    } else if (field.validity.tooLong) {
      message = `${fieldName} must be no more than ${field.maxLength} characters`;
    } else if (field.validity.patternMismatch) {
      message = `${fieldName} format is invalid`;
    }

    this.showFieldError(field, message);
  }

  validateForm(form) {
    const errors = [];
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
      if (!field.validity.valid) {
        errors.push({
          field,
          message: this.getFieldErrorMessage(field)
        });
      }
    });

    if (errors.length > 0) {
      this.showFormErrors(form, errors);
      return false;
    }

    return true;
  }

  showFieldError(field, message) {
    // Clear existing error
    this.clearFieldError(field);
    
    // Create error element
    const errorId = `${field.id || field.name}-error`;
    const errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = 'field-error';
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    errorElement.textContent = message;
    
    // Insert error after field
    field.parentNode.insertBefore(errorElement, field.nextSibling);
    
    // Update field attributes
    field.setAttribute('aria-describedby', errorId);
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('error');
    
    // Focus field
    field.focus();
  }

  clearFieldError(field) {
    const errorId = `${field.id || field.name}-error`;
    const errorElement = document.getElementById(errorId);
    
    if (errorElement) {
      errorElement.remove();
    }
    
    field.removeAttribute('aria-describedby');
    field.removeAttribute('aria-invalid');
    field.classList.remove('error');
  }

  showFormErrors(form, errors) {
    // Create or update form error summary
    let errorSummary = form.querySelector('.form-error-summary');
    
    if (!errorSummary) {
      errorSummary = document.createElement('div');
      errorSummary.className = 'form-error-summary';
      errorSummary.setAttribute('role', 'alert');
      errorSummary.setAttribute('aria-live', 'assertive');
      form.insertBefore(errorSummary, form.firstChild);
    }
    
    const errorList = document.createElement('ul');
    errorList.className = 'error-list';
    
    errors.forEach(({ field, message }) => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${field.id}`;
      link.textContent = message;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        field.focus();
      });
      
      listItem.appendChild(link);
      errorList.appendChild(listItem);
    });
    
    errorSummary.innerHTML = `
      <h3>Please correct the following errors:</h3>
    `;
    errorSummary.appendChild(errorList);
    
    // Focus error summary
    errorSummary.focus();
  }

  createErrorDisplay() {
    const errorDisplay = document.createElement('div');
    errorDisplay.id = 'error-display';
    errorDisplay.className = 'error-display';
    errorDisplay.setAttribute('role', 'alert');
    errorDisplay.setAttribute('aria-live', 'assertive');
    errorDisplay.innerHTML = `
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <div class="error-message">
          <h4 class="error-title"></h4>
          <p class="error-description"></p>
        </div>
        <div class="error-actions">
          <button class="error-close" aria-label="Close error message">×</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(errorDisplay);
    
    // Close button
    errorDisplay.querySelector('.error-close').addEventListener('click', () => {
      this.hideError();
    });
    
    // Auto-hide after timeout
    errorDisplay.addEventListener('click', () => {
      this.hideError();
    });
  }

  showNextError() {
    if (this.errorQueue.length === 0 || this.isShowingError) return;
    
    const error = this.errorQueue.shift();
    const errorDisplay = document.getElementById('error-display');
    
    // Update content
    errorDisplay.querySelector('.error-title').textContent = error.message;
    errorDisplay.querySelector('.error-description').textContent = error.details || '';
    
    // Set severity class
    errorDisplay.className = `error-display error-${error.severity}`;
    
    // Show error
    errorDisplay.classList.add('show');
    this.isShowingError = true;
    
    // Auto-hide after 5 seconds for warnings, 10 seconds for errors
    const timeout = error.severity === 'error' ? 10000 : 5000;
    setTimeout(() => {
      if (this.isShowingError) {
        this.hideError();
      }
    }, timeout);
  }

  hideError() {
    const errorDisplay = document.getElementById('error-display');
    errorDisplay.classList.remove('show');
    this.isShowingError = false;
    
    // Show next error if any
    setTimeout(() => {
      if (this.errorQueue.length > 0) {
        this.showNextError();
      }
    }, 300);
  }

  announceError(errorInfo) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      const priority = errorInfo.severity === 'error' ? 'assertive' : 'polite';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = errorInfo.message;
      
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  setupSuccessFeedback() {
    // Success notifications
    document.addEventListener('form-success', (event) => {
      this.showSuccess(event.detail.message);
    });
  }

  setupLoadingStates() {
    // Add loading indicators
    document.addEventListener('loading-start', (event) => {
      this.showLoading(event.detail.message || 'Loading...');
    });
    
    document.addEventListener('loading-end', () => {
      this.hideLoading();
    });
  }

  setupConfirmationDialogs() {
    // Confirmation for destructive actions
    document.addEventListener('click', (event) => {
      if (event.target.hasAttribute('data-confirm')) {
        const message = event.target.getAttribute('data-confirm');
        if (!confirm(message)) {
          event.preventDefault();
        }
      }
    });
  }

  showSuccess(message) {
    const notification = this.createNotification(message, 'success');
    this.showNotification(notification);
  }

  showLoading(message) {
    const loader = document.createElement('div');
    loader.id = 'loading-indicator';
    loader.className = 'loading-indicator';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-live', 'polite');
    loader.innerHTML = `
      <div class="loading-spinner"></div>
      <span class="loading-message">${message}</span>
    `;
    
    document.body.appendChild(loader);
  }

  hideLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
      loader.remove();
    }
  }

  createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Close notification">×</button>
      </div>
    `;
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
    
    return notification;
  }

  showNotification(notification) {
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  getFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label) {
      return label.textContent.trim();
    }
    
    const ariaLabel = field.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }
    
    return field.name || field.placeholder || 'Field';
  }

  getFieldErrorMessage(field) {
    const fieldName = this.getFieldLabel(field);
    
    if (field.validity.valueMissing) {
      return `${fieldName} is required`;
    } else if (field.validity.typeMismatch) {
      if (field.type === 'email') {
        return `Please enter a valid email address`;
      }
    } else if (field.validity.tooShort) {
      return `${fieldName} must be at least ${field.minLength} characters`;
    } else if (field.validity.tooLong) {
      return `${fieldName} must be no more than ${field.maxLength} characters`;
    }
    
    return field.validationMessage || `${fieldName} is invalid`;
  }
}

// Initialize error handling system
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    new ErrorHandlingSystem();
  });
}
