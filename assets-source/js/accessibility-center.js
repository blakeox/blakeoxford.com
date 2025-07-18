/**
 * Advanced Accessibility Preferences Center
 * Provides comprehensive user control over accessibility features
 */

export class AccessibilityCenter {
  constructor() {
    this.preferences = this.loadPreferences();
    this.init();
  }

  init() {
    this.createAccessibilityPanel();
    this.setupPreferenceControls();
    this.applyPreferences();
    this.setupKeyboardShortcuts();
  }

  loadPreferences() {
    const defaults = {
      fontSize: 'medium',
      fontFamily: 'default',
      lineHeight: 'normal',
      letterSpacing: 'normal',
      colorScheme: 'auto',
      highContrast: false,
      reducedMotion: this.detectReducedMotion(),
      soundEnabled: true,
      voiceAnnouncements: true,
      focusIndicator: 'enhanced',
      cursorSize: 'default',
      underlineLinks: false,
      hideImages: false,
      simplifyLayout: false
    };

    const saved = localStorage.getItem('accessibility-preferences');
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  }

  savePreferences() {
    localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
  }

  createAccessibilityPanel() {
    // Create floating accessibility button
    const button = document.createElement('button');
    button.id = 'accessibility-toggle';
    button.className = 'accessibility-toggle';
    button.setAttribute('aria-label', 'Open accessibility settings');
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    `;
    // Check if document.body is available
    if (document.body) {
      document.body.appendChild(button);
    } else {
      console.warn('AccessibilityCenter: document.body not available, deferring button creation');
      setTimeout(() => {
        if (document.body) {
          document.body.appendChild(button);
        }
      }, 100);
    }

    // Create accessibility panel
    const panel = document.createElement('div');
    panel.id = 'accessibility-panel';
    panel.className = 'accessibility-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'accessibility-title');
    panel.setAttribute('aria-hidden', 'true');
    
    panel.innerHTML = `
      <div class="accessibility-panel-content">
        <header class="accessibility-panel-header">
          <h2 id="accessibility-title">Accessibility Settings</h2>
          <button id="accessibility-close" aria-label="Close accessibility settings">×</button>
        </header>
        
        <div class="accessibility-panel-body">
          <section>
            <h3>Visual Preferences</h3>
            
            <div class="preference-group">
              <label for="font-size">Font Size</label>
              <select id="font-size" name="fontSize">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>

            <div class="preference-group">
              <label for="font-family">Font Family</label>
              <select id="font-family" name="fontFamily">
                <option value="default">Default</option>
                <option value="sans-serif">Sans Serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
                <option value="dyslexic">Dyslexic Friendly</option>
              </select>
            </div>

            <div class="preference-group">
              <label for="line-height">Line Height</label>
              <select id="line-height" name="lineHeight">
                <option value="tight">Tight</option>
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
                <option value="loose">Loose</option>
              </select>
            </div>

            <div class="preference-group">
              <label for="color-scheme">Color Scheme</label>
              <select id="color-scheme" name="colorScheme">
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div class="preference-group">
              <label>
                <input type="checkbox" name="highContrast" id="high-contrast">
                High Contrast Mode
              </label>
            </div>

            <div class="preference-group">
              <label>
                <input type="checkbox" name="underlineLinks" id="underline-links">
                Underline All Links
              </label>
            </div>
          </section>

          <section>
            <h3>Motion & Animation</h3>
            
            <div class="preference-group">
              <label>
                <input type="checkbox" name="reducedMotion" id="reduced-motion">
                Reduce Motion
              </label>
            </div>
          </section>

          <section>
            <h3>Focus & Navigation</h3>
            
            <div class="preference-group">
              <label for="focus-indicator">Focus Indicator Style</label>
              <select id="focus-indicator" name="focusIndicator">
                <option value="default">Default</option>
                <option value="enhanced">Enhanced</option>
                <option value="high-visibility">High Visibility</option>
              </select>
            </div>

            <div class="preference-group">
              <label for="cursor-size">Cursor Size</label>
              <select id="cursor-size" name="cursorSize">
                <option value="default">Default</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>
          </section>

          <section>
            <h3>Audio & Feedback</h3>
            
            <div class="preference-group">
              <label>
                <input type="checkbox" name="soundEnabled" id="sound-enabled">
                Sound Effects
              </label>
            </div>

            <div class="preference-group">
              <label>
                <input type="checkbox" name="voiceAnnouncements" id="voice-announcements">
                Voice Announcements
              </label>
            </div>
          </section>

          <section>
            <h3>Content Simplification</h3>
            
            <div class="preference-group">
              <label>
                <input type="checkbox" name="hideImages" id="hide-images">
                Hide Decorative Images
              </label>
            </div>

            <div class="preference-group">
              <label>
                <input type="checkbox" name="simplifyLayout" id="simplify-layout">
                Simplify Layout
              </label>
            </div>
          </section>
        </div>

        <footer class="accessibility-panel-footer">
          <button id="reset-preferences" class="btn-secondary">Reset to Defaults</button>
          <button id="save-preferences" class="btn-primary">Save Settings</button>
        </footer>
      </div>
    `;
    
    // Check if document.body is available
    if (document.body) {
      document.body.appendChild(panel);
    } else {
      console.warn('AccessibilityCenter: document.body not available, deferring panel creation');
      setTimeout(() => {
        if (document.body) {
          document.body.appendChild(panel);
        }
      }, 100);
    }
    this.setupPanelEvents(button, panel);
  }

  setupPanelEvents(button, panel) {
    const closeButton = panel.querySelector('#accessibility-close');
    
    // Open panel
    button.addEventListener('click', () => {
      this.openPanel(panel);
    });

    // Close panel
    closeButton.addEventListener('click', () => {
      this.closePanel(panel);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.getAttribute('aria-hidden') === 'false') {
        this.closePanel(panel);
      }
    });

    // Close on outside click
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        this.closePanel(panel);
      }
    });
  }

  openPanel(panel) {
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('open');
    
    // Focus first input
    const firstInput = panel.querySelector('select, input');
    if (firstInput) {
      firstInput.focus();
    }

    // Create focus trap
    this.focusTrap = this.createFocusTrap(panel);
    this.focusTrap.activate();
  }

  closePanel(panel) {
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.remove('open');
    
    if (this.focusTrap) {
      this.focusTrap.deactivate();
    }

    // Return focus to toggle button
    document.getElementById('accessibility-toggle').focus();
  }

  setupPreferenceControls() {
    const panel = document.getElementById('accessibility-panel');
    
    // Set initial values
    Object.entries(this.preferences).forEach(([key, value]) => {
      const control = panel.querySelector(`[name="${key}"]`);
      if (control) {
        if (control.type === 'checkbox') {
          control.checked = value;
        } else {
          control.value = value;
        }
      }
    });

    // Listen for changes
    panel.addEventListener('change', (e) => {
      const { name, type, checked, value } = e.target;
      if (name) {
        this.preferences[name] = type === 'checkbox' ? checked : value;
        this.applyPreference(name, this.preferences[name]);
      }
    });

    // Save button
    panel.querySelector('#save-preferences').addEventListener('click', () => {
      this.savePreferences();
      this.announce('Accessibility settings saved successfully.');
    });

    // Reset button
    panel.querySelector('#reset-preferences').addEventListener('click', () => {
      this.resetToDefaults();
      this.announce('Accessibility settings reset to defaults.');
    });
  }

  applyPreferences() {
    Object.entries(this.preferences).forEach(([key, value]) => {
      this.applyPreference(key, value);
    });
  }

  applyPreference(key, value) {
    const root = document.documentElement;
    
    switch (key) {
      case 'fontSize':
        root.setAttribute('data-font-size', value);
        break;
      case 'fontFamily':
        root.setAttribute('data-font-family', value);
        break;
      case 'lineHeight':
        root.setAttribute('data-line-height', value);
        break;
      case 'letterSpacing':
        root.setAttribute('data-letter-spacing', value);
        break;
      case 'colorScheme':
        if (value !== 'auto') {
          root.setAttribute('data-color-scheme', value);
        }
        break;
      case 'highContrast':
        root.setAttribute('data-high-contrast', value);
        break;
      case 'reducedMotion':
        root.setAttribute('data-reduced-motion', value);
        if (value) {
          root.style.setProperty('--animation-duration', '0.01ms');
          root.style.setProperty('--transition-duration', '0.01ms');
        } else {
          root.style.removeProperty('--animation-duration');
          root.style.removeProperty('--transition-duration');
        }
        break;
      case 'focusIndicator':
        root.setAttribute('data-focus-style', value);
        break;
      case 'cursorSize':
        root.setAttribute('data-cursor-size', value);
        break;
      case 'underlineLinks':
        root.setAttribute('data-underline-links', value);
        break;
      case 'hideImages':
        root.setAttribute('data-hide-images', value);
        break;
      case 'simplifyLayout':
        root.setAttribute('data-simplify-layout', value);
        break;
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + A: Open accessibility panel
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        document.getElementById('accessibility-toggle').click();
      }
      
      // Alt + 1-9: Quick accessibility toggles
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        this.handleQuickToggle(e.key);
      }
    });
  }

  handleQuickToggle(key) {
    const toggles = {
      '1': () => this.togglePreference('highContrast'),
      '2': () => this.togglePreference('reducedMotion'),
      '3': () => this.cycleFontSize(),
      '4': () => this.togglePreference('underlineLinks'),
      '5': () => this.togglePreference('hideImages'),
      '6': () => this.togglePreference('simplifyLayout'),
      '7': () => this.togglePreference('soundEnabled'),
      '8': () => this.togglePreference('voiceAnnouncements'),
      '9': () => this.cycleColorScheme()
    };

    if (toggles[key]) {
      toggles[key]();
      this.savePreferences();
    }
  }

  togglePreference(key) {
    this.preferences[key] = !this.preferences[key];
    this.applyPreference(key, this.preferences[key]);
    this.updatePanelControls();
    
    const status = this.preferences[key] ? 'enabled' : 'disabled';
    this.announce(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${status}`);
  }

  cycleFontSize() {
    const sizes = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.preferences.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    
    this.preferences.fontSize = sizes[nextIndex];
    this.applyPreference('fontSize', this.preferences.fontSize);
    this.updatePanelControls();
    this.announce(`Font size changed to ${this.preferences.fontSize}`);
  }

  cycleColorScheme() {
    const schemes = ['auto', 'light', 'dark'];
    const currentIndex = schemes.indexOf(this.preferences.colorScheme);
    const nextIndex = (currentIndex + 1) % schemes.length;
    
    this.preferences.colorScheme = schemes[nextIndex];
    this.applyPreference('colorScheme', this.preferences.colorScheme);
    this.updatePanelControls();
    this.announce(`Color scheme changed to ${this.preferences.colorScheme}`);
  }

  updatePanelControls() {
    const panel = document.getElementById('accessibility-panel');
    if (panel) {
      Object.entries(this.preferences).forEach(([key, value]) => {
        const control = panel.querySelector(`[name="${key}"]`);
        if (control) {
          if (control.type === 'checkbox') {
            control.checked = value;
          } else {
            control.value = value;
          }
        }
      });
    }
  }

  resetToDefaults() {
    this.preferences = this.loadPreferences();
    this.applyPreferences();
    this.updatePanelControls();
    this.savePreferences();
  }

  announce(message, priority = 'polite') {
    if (!this.preferences.voiceAnnouncements) return;
    
    const liveRegion = document.getElementById('live-region') || this.createLiveRegion();
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }

  createLiveRegion() {
    const region = document.createElement('div');
    region.id = 'live-region';
    region.className = 'sr-only';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    // Check if document.body is available
    if (document.body) {
      document.body.appendChild(region);
    } else {
      console.warn('AccessibilityCenter: document.body not available, deferring region creation');
      setTimeout(() => {
        if (document.body) {
          document.body.appendChild(region);
        }
      }, 100);
    }
    return region;
  }

  createFocusTrap(element) {
    // Simple focus trap implementation
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const trap = {
      activate() {
        element.addEventListener('keydown', this.handleKeyDown);
      },
      deactivate() {
        element.removeEventListener('keydown', this.handleKeyDown);
      },
      handleKeyDown(e) {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };

    return trap;
  }

  detectReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

// Initialize accessibility center
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    new AccessibilityCenter();
  });
}
