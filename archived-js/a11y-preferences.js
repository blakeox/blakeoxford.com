// Enhanced Accessibility Preferences Manager
class A11yPreferenceManager {
  constructor() {
    this.preferences = this.loadPreferences();
    this.initializePreferences();
  }

  loadPreferences() {
    const saved = localStorage.getItem('a11y-preferences');
    return saved ? JSON.parse(saved) : {
      reducedMotion: this.detectReducedMotion(),
      highContrast: this.detectHighContrast(),
      fontSize: 'normal',
      focusIndicator: 'enhanced',
      soundEnabled: false,
      voiceAnnouncements: true
    };
  }

  detectReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  detectHighContrast() {
    return window.matchMedia('(prefers-contrast: more)').matches;
  }

  savePreferences() {
    localStorage.setItem('a11y-preferences', JSON.stringify(this.preferences));
  }

  updatePreference(key, value) {
    this.preferences[key] = value;
    this.savePreferences();
    this.applyPreference(key, value);
  }

  applyPreference(key, value) {
    switch(key) {
      case 'reducedMotion':
        document.documentElement.style.setProperty('--motion-duration', value ? '0ms' : 'var(--duration)');
        break;
      case 'highContrast':
        document.documentElement.setAttribute('data-contrast', value ? 'high' : 'normal');
        break;
      case 'fontSize':
        document.documentElement.setAttribute('data-font-size', value);
        break;
      case 'focusIndicator':
        document.documentElement.setAttribute('data-focus-style', value);
        break;
    }
  }

  initializePreferences() {
    Object.entries(this.preferences).forEach(([key, value]) => {
      this.applyPreference(key, value);
    });
  }

  // Voice announcement support
  announce(message, priority = 'polite') {
    if (!this.preferences.voiceAnnouncements) return;
    
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    setTimeout(() => document.body.removeChild(announcer), 1000);
  }
}

// Initialize globally
window.a11yPreferences = new A11yPreferenceManager();
