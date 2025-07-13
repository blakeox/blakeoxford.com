// Validation functions
function validateField(field) {
  const value = field.value.trim();
  let errorMessage = '';

  // Required field validation
  if (field.hasAttribute('required') && !value) {
    errorMessage = `${getFieldLabel(field)} is required and cannot be empty.`;
  }
  // Email validation
  else if (field.type === 'email' && value && !isValidEmail(value)) {
    errorMessage = 'Please enter a valid email address (e.g., name@domain.com).';
  }
  // Minimum length validation
  else if (field.getAttribute('minlength') && value.length > 0 && value.length < parseInt(field.getAttribute('minlength'))) {
    errorMessage = `${getFieldLabel(field)} must be at least ${field.getAttribute('minlength')} characters long.`;
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
    showFieldError(field, errorMessage);
    return false;
  } else {
    clearFieldError(field);
    return true;
  }
}

function showFieldError(field, message) {
  const errorContainer = document.getElementById(`${field.id}-error`);
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('border-red-500');
  }
}

function clearFieldError(field) {
  const errorContainer = document.getElementById(`${field.id}-error`);
  if (errorContainer) {
    errorContainer.textContent = '';
    errorContainer.classList.add('hidden');
    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('border-red-500');
  }
}

function getFieldLabel(field) {
  const label = field.labels && field.labels[0];
  if (label) {
    return label.textContent.replace('*', '').trim();
  }
  return field.getAttribute('aria-label') || field.name || 'Field';
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Initialize form validation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Contact form validation script loaded');

  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  if (!form || !status) {
    console.error('Form or status element not found');
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const label = document.getElementById('btn-label');
  const spinner = document.getElementById('spinner');

  // Add real-time validation
  const inputs = form.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => clearFieldError(input));
  });

  // Custom form submission with validation
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('Form submitted, validating...');

    // Validate all required fields
    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    const messageField = document.getElementById('message');

    let isValid = true;
    const invalidFields = [];

    // Validate each field and show errors
    if (!validateField(nameField)) {
      isValid = false;
      invalidFields.push('Name');
    }
    if (!validateField(emailField)) {
      isValid = false;
      invalidFields.push('Email');
    }
    if (!validateField(messageField)) {
      isValid = false;
      invalidFields.push('Message');
    }

    console.log('Validation result:', { isValid, invalidFields });

    if (!isValid) {
      // Focus first invalid field
      const firstInvalidField = form.querySelector('[aria-invalid="true"]');
      if (firstInvalidField) {
        firstInvalidField.focus();
      }

      // Show validation summary
      status.textContent = `❌ Please correct ${invalidFields.length} error${invalidFields.length > 1 ? 's' : ''}: ${invalidFields.join(', ')}`;
      status.className = 'text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-center font-semibold mb-4';
      status.classList.remove('hidden');

      return;
    }

    // Clear any previous status messages
    status.classList.add('hidden');

    // Show loading state
    if (btn && label && spinner) {
      btn.disabled = true;
      label.textContent = 'Sending…';
      spinner.classList.remove('hidden');
    }

    const fd = new FormData(form);
    if (fd.get('bot-field')) return;

    // Include Turnstile token
    const token = document.querySelector('[name="cf-turnstile-response"]')?.value || '';

    const payload = {
      name: fd.get('name'),
      email: fd.get('email'),
      message: fd.get('message'),
      token
    };

    try {
      const res = await fetch('/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        status.textContent = '✅ Thank you for your message! I\'ll get back to you soon. 🎉';
        status.className = 'text-green-600 bg-green-50 border border-green-200 rounded-lg p-4 text-center font-semibold mb-4';
        status.classList.remove('hidden');

        console.log('✅ Form submitted successfully');

        form.reset();

        // Clear all validation states
        [nameField, emailField, messageField].forEach(input => {
          if (input) {
            input.setAttribute('aria-invalid', 'false');
            input.classList.remove('border-red-500');
            const errorContainer = document.getElementById(`${input.id}-error`);
            if (errorContainer) {
              errorContainer.classList.add('hidden');
              errorContainer.textContent = '';
            }
          }
        });
      } else {
        status.textContent = `❌ ${json.error || 'Something went wrong. Please try again.'}`;
        status.className = 'text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-center font-semibold mb-4';
        status.classList.remove('hidden');
      }
    } catch {
      status.textContent = '❌ Server error. Please check your connection and try again.';
      status.className = 'text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-center font-semibold mb-4';
      status.classList.remove('hidden');
    } finally {
      if (btn && label && spinner) {
        btn.disabled = false;
        label.textContent = 'Send Message';
        spinner.classList.add('hidden');
      }
    }
  });
});
