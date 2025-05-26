import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Contact form validation', () => {
  let dom: JSDOM;
  let document: Document;
  let form: HTMLFormElement;
  
  beforeEach(() => {
    // Read the contact form markup from the file
    const contactPagePath = path.resolve(__dirname, '../src/pages/contact.astro');
    const contactPage = fs.readFileSync(contactPagePath, 'utf-8');
    
    // Find the form section in the file
    const formRegex = /<form[^>]*>[\s\S]*?<\/form>/;
    const formMatch = contactPage.match(formRegex);
    const formHTML = formMatch ? formMatch[0] : '<form></form>';
    
    // Create a new JSDOM instance with the form
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="form-container">
            ${formHTML}
          </div>
          <div id="form-status" aria-live="polite" class="hidden"></div>
        </body>
      </html>
    `, {
      url: 'https://localhost',
      runScripts: 'dangerously'
    });
    
    document = dom.window.document;
    form = document.querySelector('form') as HTMLFormElement;
  });
  
  it('should have required attributes on name field', () => {
    const nameInput = form.querySelector('#name') as HTMLInputElement;
    expect(nameInput).not.toBeNull();
    expect(nameInput.required).toBe(true);
    expect(nameInput.hasAttribute('aria-required')).toBe(true);
  });
  
  it('should have required attributes on email field', () => {
    const emailInput = form.querySelector('#email') as HTMLInputElement;
    expect(emailInput).not.toBeNull();
    expect(emailInput.required).toBe(true);
    expect(emailInput.hasAttribute('aria-required')).toBe(true);
    expect(emailInput.type).toBe('email');
  });
  
  it('should have required attributes on message field', () => {
    const messageInput = form.querySelector('#message') as HTMLTextAreaElement;
    expect(messageInput).not.toBeNull();
    expect(messageInput.required).toBe(true);
    expect(messageInput.hasAttribute('aria-required')).toBe(true);
  });

  describe('Form validation', () => {
    it('should validate a valid form submission', () => {
      // Fill in the form with valid data
      const nameInput = form.querySelector('#name') as HTMLInputElement;
      const emailInput = form.querySelector('#email') as HTMLInputElement;
      const messageInput = form.querySelector('#message') as HTMLTextAreaElement;
      
      nameInput.value = 'Test User';
      emailInput.value = 'test@example.com';
      messageInput.value = 'This is a test message';
      
      // Check form validity
      expect(form.checkValidity()).toBe(true);
      
      // Check individual field validity
      expect(nameInput.validity.valid).toBe(true);
      expect(emailInput.validity.valid).toBe(true);
      expect(messageInput.validity.valid).toBe(true);
    });
    
    it('should invalidate form with empty name', () => {
      // Fill in the form with invalid data (empty name)
      const nameInput = form.querySelector('#name') as HTMLInputElement;
      const emailInput = form.querySelector('#email') as HTMLInputElement;
      const messageInput = form.querySelector('#message') as HTMLTextAreaElement;
      
      nameInput.value = '';
      emailInput.value = 'test@example.com';
      messageInput.value = 'This is a test message';
      
      // Check form validity
      expect(form.checkValidity()).toBe(false);
      
      // Check individual field validity
      expect(nameInput.validity.valid).toBe(false);
      expect(emailInput.validity.valid).toBe(true);
      expect(messageInput.validity.valid).toBe(true);
    });
    
    it('should invalidate form with invalid email format', () => {
      // Fill in the form with invalid data (invalid email)
      const nameInput = form.querySelector('#name') as HTMLInputElement;
      const emailInput = form.querySelector('#email') as HTMLInputElement;
      const messageInput = form.querySelector('#message') as HTMLTextAreaElement;
      
      nameInput.value = 'Test User';
      emailInput.value = 'invalid-email';
      messageInput.value = 'This is a test message';
      
      // Check form validity
      expect(form.checkValidity()).toBe(false);
      
      // Check individual field validity
      expect(nameInput.validity.valid).toBe(true);
      expect(emailInput.validity.valid).toBe(false);
      expect(messageInput.validity.valid).toBe(true);
    });
    
    it('should invalidate form with empty message', () => {
      // Fill in the form with invalid data (empty message)
      const nameInput = form.querySelector('#name') as HTMLInputElement;
      const emailInput = form.querySelector('#email') as HTMLInputElement;
      const messageInput = form.querySelector('#message') as HTMLTextAreaElement;
      
      nameInput.value = 'Test User';
      emailInput.value = 'test@example.com';
      messageInput.value = '';
      
      // Check form validity
      expect(form.checkValidity()).toBe(false);
      
      // Check individual field validity
      expect(nameInput.validity.valid).toBe(true);
      expect(emailInput.validity.valid).toBe(true);
      expect(messageInput.validity.valid).toBe(false);
    });
  });

  describe('Form submission', () => {
    let originalSubmit: typeof HTMLFormElement.prototype.submit;
    let submitSpy: any;
    
    beforeEach(() => {
      // Mock the form submit method
      originalSubmit = HTMLFormElement.prototype.submit;
      submitSpy = vi.fn();
      HTMLFormElement.prototype.submit = submitSpy;
      
      // Add preventDefault to avoid actual form submission
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitSpy(); // Manually call the spy since we're preventing the default
      });
    });
    
    afterEach(() => {
      // Restore the original submit method
      HTMLFormElement.prototype.submit = originalSubmit;
    });
    
    it('should submit the form with valid data', () => {
      // Fill in the form with valid data
      const nameInput = form.querySelector('#name') as HTMLInputElement;
      const emailInput = form.querySelector('#email') as HTMLInputElement;
      const messageInput = form.querySelector('#message') as HTMLTextAreaElement;
      const submitButton = document.createElement('button');
      
      submitButton.type = 'submit';
      form.appendChild(submitButton);
      
      nameInput.value = 'Test User';
      emailInput.value = 'test@example.com';
      messageInput.value = 'This is a test message';
      
      // Submit the form
      submitButton.click();
      
      // Check that form was submitted (our spy should be called)
      expect(submitSpy).toHaveBeenCalled();
    });
  });
});
