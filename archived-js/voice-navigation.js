// Voice Control Enhancement
class VoiceNavigationEnhancer {
  constructor() {
    this.commands = new Map();
    this.isListening = false;
    this.recognition = null;
    this.initializeVoiceRecognition();
    this.setupCommands();
  }

  initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        this.processCommand(command);
      };

      this.recognition.onerror = (event) => {
        console.log('Voice recognition error:', event.error);
      };
    }
  }

  setupCommands() {
    // Navigation commands
    this.commands.set('go home', () => window.location.href = '/');
    this.commands.set('go to about', () => window.location.href = '/about');
    this.commands.set('go to projects', () => window.location.href = '/projects');
    this.commands.set('go to contact', () => window.location.href = '/contact');
    this.commands.set('go to blog', () => window.location.href = '/blog');

    // Interface commands
    this.commands.set('open search', () => {
      if (window.searchOverlayEnhancer) {
        window.searchOverlayEnhancer.openSearch();
      }
    });

    this.commands.set('close search', () => {
      if (window.searchOverlayEnhancer) {
        window.searchOverlayEnhancer.closeSearch();
      }
    });

    this.commands.set('toggle theme', () => {
      const themeToggle = document.querySelector('[data-theme-toggle]');
      if (themeToggle) themeToggle.click();
    });

    // Accessibility commands
    this.commands.set('increase font size', () => {
      window.a11yPreferences?.updatePreference('fontSize', 'large');
    });

    this.commands.set('enable high contrast', () => {
      window.a11yPreferences?.updatePreference('highContrast', true);
    });

    this.commands.set('reduce motion', () => {
      window.a11yPreferences?.updatePreference('reducedMotion', true);
    });

    // Reading commands
    this.commands.set('read page', () => {
      this.readMainContent();
    });

    this.commands.set('stop reading', () => {
      speechSynthesis.cancel();
    });
  }

  processCommand(command) {
    // Exact match first
    if (this.commands.has(command)) {
      this.commands.get(command)();
      this.announceCommand(`Executed: ${command}`);
      return;
    }

    // Fuzzy matching for partial commands
    for (const [key, action] of this.commands) {
      if (command.includes(key) || key.includes(command)) {
        action();
        this.announceCommand(`Executed: ${key}`);
        return;
      }
    }

    this.announceCommand('Command not recognized');
  }

  announceCommand(message) {
    if (window.a11yPreferences?.preferences.voiceAnnouncements) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.8;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    }
  }

  readMainContent() {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      const text = this.extractReadableText(mainContent);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }

  extractReadableText(element) {
    // Get text content while preserving structure
    let text = '';
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (parent.style.display === 'none' ||
              parent.classList.contains('sr-only') ||
              parent.hasAttribute('aria-hidden')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      text += node.textContent + ' ';
    }

    return text.trim();
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
      this.announceCommand('Voice navigation activated');
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.announceCommand('Voice navigation deactivated');
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }
}

// Initialize voice navigation
if ('webkitSpeechRecognition' in window) {
  window.voiceNavigation = new VoiceNavigationEnhancer();

  // Add voice activation shortcut (Ctrl+Shift+V)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'V') {
      e.preventDefault();
      window.voiceNavigation.toggleListening();
    }
  });
}
