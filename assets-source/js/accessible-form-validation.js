/**
 * Enhanced Form Validation and Error Handling
 * Provides comprehensive accessibility for form interactions
 */

export class AccessibleFormValidation {
  constructor(formSelector = 'form') {
    this.forms = document.querySelectorAll(formSelector);
    this.initializeForms();
  }

  initializeForms() {
    this.forms.forEach(form => {
      this.setupFormValidation(form);
      this.setupRealTimeValidation(form);
      this.setupSubmissionHandling(form);
    });
  }

  setupFormValidation(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      // Create error message container if it doesn't exist
      const errorId = `${input.id}-error`;
      if (!document.getElementById(errorId)) {
        const errorDiv = document.createElement('div');
        errorDiv.id = errorId;
        errorDiv.className = 'text-red-600 text-sm hidden';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'polite');
        input.parentNode.appendChild(errorDiv);
      }

      // Add aria-describedby if not present
      const describedBy = input.getAttribute('aria-describedby') || '';
      if (!describedBy.includes(errorId)) {
        input.setAttribute('aria-describedby', `${describedBy} ${errorId}`.trim());
      }
    });
  }

  setupRealTimeValidation(form) {
    const inputs = form.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
      // Validate on blur (when user leaves field)
      input.addEventListener('blur', () => {
        this.validateField(input);
      });

      // Clear errors on input (when user starts typing)
      input.addEventListener('input', () => {
        this.clearFieldError(input);
      });
    });
  }

  validateField(field) {
    const value = field.value.trim();
    const errorContainer = document.getElementById(`${field.id}-error`);
    let errorMessage = '';

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      errorMessage = `${this.getFieldLabel(field)} is required and cannot be empty.`;
    }
    // Email validation
    else if (field.type === 'email' && value && !this.isValidEmail(value)) {
      errorMessage = 'Please enter a valid email address (e.g., name@domain.com).';
    }
    // Minimum length validation
    else if (field.minLength && value.length > 0 && value.length < field.minLength) {
      errorMessage = `${this.getFieldLabel(field)} must be at least ${field.minLength} characters long.`;
    }
    // Maximum length validation
    else if (field.maxLength && value.length > field.maxLength) {
      errorMessage = `${this.getFieldLabel(field)} must be no more than ${field.maxLength} characters long.`;
    }
    // Custom validation for message content
    else if (field.name === 'message' && value.length > 0 && value.length < 10) {
      errorMessage = 'Please provide a more detailed message (at least 10 characters).';
    }
    // Custom validation for name field
    else if (field.name === 'name' && value.length > 0 && value.length < 2) {
      errorMessage = 'Name must be at least 2 characters long.';
    }

    if (errorMessage) {
      this.showFieldError(field, errorMessage);
      return false;
    } else {
      this.clearFieldError(field);
      return true;
    }
  }

  showFieldError(field, message) {
    const errorContainer = document.getElementById(`${field.id}-error`);
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.classList.remove('hidden');
      field.setAttribute('aria-invalid', 'true');
      field.classList.add('border-red-500');
      
      // Announce error to screen readers
      if (window.srAnnouncer) {
        window.srAnnouncer.announce(`Error: ${message}`, 'assertive');
      }
    }
  }

  clearFieldError(field) {
    const errorContainer = document.getElementById(`${field.id}-error`);
    if (errorContainer) {
      errorContainer.textContent = '';
      errorContainer.classList.add('hidden');
      field.setAttribute('aria-invalid', 'false');
      field.classList.remove('border-red-500');
    }
  }

  setupSubmissionHandling(form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Validate all fields
      const inputs = form.querySelectorAll('input, textarea');
      let isValid = true;
      const invalidFields = [];

      inputs.forEach(input => {
        if (!this.validateField(input)) {
          isValid = false;
          invalidFields.push(this.getFieldLabel(input));
        }
      });

      if (!isValid) {
        // Focus first invalid field
        const firstInvalidField = form.querySelector('[aria-invalid="true"]');
        if (firstInvalidField) {
          firstInvalidField.focus();
        }

        // Show form-level error summary
        const statusContainer = document.getElementById('form-status');
        if (statusContainer) {
          statusContainer.textContent = `Please correct ${invalidFields.length} error${invalidFields.length > 1 ? 's' : ''}: ${invalidFields.join(', ')}`;
          statusContainer.className = 'text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-center font-semibold mb-4';
          statusContainer.classList.remove('hidden');
        }

        // Announce validation summary
        if (window.srAnnouncer) {
          window.srAnnouncer.announce(
            `Form contains ${invalidFields.length} error${invalidFields.length > 1 ? 's' : ''}. Please correct the following fields: ${invalidFields.join(', ')}`,
            'assertive'
          );
        }

        return;
      }

      // If valid, proceed with submission
      this.handleFormSubmission(form);
    });
  }

  handleFormSubmission(form) {
    // This method is overridden by custom form handlers
    // but provides default behavior for forms without custom logic
    const submitButton = form.querySelector('button[type="submit"]');
    const statusContainer = document.getElementById('form-status');
    
    // Show loading state
    if (submitButton) {
      submitButton.setAttribute('aria-disabled', 'true');
      submitButton.classList.add('loading');
      const buttonText = submitButton.querySelector('#btn-label');
      if (buttonText) {
        buttonText.textContent = 'Sending...';
      }
    }

    // Announce loading state
    if (window.srAnnouncer) {
      window.srAnnouncer.announce('Sending message, please wait...', 'polite');
    }

    // Default success simulation (should be replaced by actual logic)
    setTimeout(() => {
      this.showSubmissionSuccess(form);
    }, 2000);
  }

  showSubmissionSuccess(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const statusContainer = document.getElementById('form-status');
    
    // Reset button state
    if (submitButton) {
      submitButton.removeAttribute('aria-disabled');
      submitButton.classList.remove('loading');
      const buttonText = submitButton.querySelector('#btn-label');
      if (buttonText) {
        buttonText.textContent = 'Send Message';
      }
    }

    // Show success message
    if (statusContainer) {
      statusContainer.className = 'text-green-600 bg-green-50 border border-green-200 rounded-lg p-4 text-center font-semibold mb-4';
      statusContainer.textContent = '✅ Message sent successfully! I\'ll get back to you soon.';
    }

    // Announce success
    if (window.srAnnouncer) {
      window.srAnnouncer.announce('Message sent successfully! I will get back to you soon.', 'polite');
    }

    // Reset form
    form.reset();
    
    // Clear any remaining errors
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => this.clearFieldError(input));
  }

  getFieldLabel(field) {
    const label = field.labels && field.labels[0];
    if (label) {
      return label.textContent.replace('*', '').trim();
    }
    return field.getAttribute('aria-label') || field.name || 'Field';
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    new AccessibleFormValidation();
  });
}
