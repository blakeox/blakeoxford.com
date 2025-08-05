/**
 * PWA Enhancement System
 * Transforms the site into a full Progressive Web App
 */

class PWAEnhancer {
  constructor() {
    this.installPrompt = null;
    this.isInstalled = false;
    this.updateAvailable = false;

    this.init();
  }

  init() {
    // Check if we're in a test environment (Playwright injects window.playwright)
    this.isTestEnvironment = typeof window !== 'undefined' && 
                            (window.navigator.webdriver || 
                             window.playwright || 
                             window.location.hostname === 'localhost');
    
    this.checkInstallStatus();
    this.setupInstallPrompt();
    this.setupUpdateDetection();
    this.setupOfflineIndicator();
    this.setupPushNotifications();
    this.setupBackgroundSync();

    console.log('📱 PWA Enhancement initialized', this.isTestEnvironment ? '(Test Mode)' : '');
  }

  // Check if app is already installed
  checkInstallStatus() {
    // Check if running in standalone mode
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true;

    if (this.isInstalled) {
      console.log('📱 App is running in standalone mode');
      this.hideInstallUI();
    }
  }

  // Setup install prompt handling
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 Install prompt available');
      e.preventDefault();
      this.installPrompt = e;
      this.showInstallUI();
    });

    // Listen for app install
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      this.isInstalled = true;
      this.hideInstallUI();
      this.trackInstallation();
    });
  }

  // Show install UI
  showInstallUI() {
    // Create install button if it doesn't exist
    let installBtn = document.getElementById('pwa-install-btn');
    if (!installBtn) {
      installBtn = this.createInstallButton();
      document.body.appendChild(installBtn);
    }

    installBtn.style.display = 'flex';
    installBtn.addEventListener('click', () => this.promptInstall());
  }

  // Create install button
  createInstallButton() {
    const button = document.createElement('div');
    button.id = 'pwa-install-btn';
    button.innerHTML = `
      <div class="pwa-install-container">
        <div class="pwa-install-content">
          <div class="pwa-install-icon">📱</div>
          <div class="pwa-install-text">
            <div class="pwa-install-title">Install App</div>
            <div class="pwa-install-subtitle">Get the full experience</div>
          </div>
          <button class="pwa-install-action" aria-label="Install PWA">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          <button class="pwa-install-close" aria-label="Close install prompt">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        color: white;
        max-width: 300px;
        animation: slideInUp 0.3s ease-out;
      }

      .pwa-install-content {
        display: flex;
        align-items: center;
        padding: 16px;
        gap: 12px;
      }

      .pwa-install-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .pwa-install-text {
        flex: 1;
      }

      .pwa-install-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 2px;
      }

      .pwa-install-subtitle {
        font-size: 12px;
        opacity: 0.9;
      }

      .pwa-install-action, .pwa-install-close {
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        padding: 8px;
        transition: background 0.2s ease;
        flex-shrink: 0;
      }

      .pwa-install-action:hover, .pwa-install-close:hover {
        background: rgba(255,255,255,0.3);
      }

      .pwa-install-close {
        margin-left: 4px;
      }

      @keyframes slideInUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    // Add event listeners
    button.querySelector('.pwa-install-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideInstallUI();
    });

    return button;
  }

  // Prompt user to install
  async promptInstall() {
    if (!this.installPrompt) return;

    try {
      const result = await this.installPrompt.prompt();
      console.log('📱 Install prompt result:', result.outcome);

      if (result.outcome === 'accepted') {
        this.trackInstallation('accepted');
      } else {
        this.trackInstallation('declined');
      }

      this.installPrompt = null;
      this.hideInstallUI();

    } catch (error) {
      console.error('Install prompt error:', error);
    }
  }

  // Hide install UI
  hideInstallUI() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  }

  // Setup update detection
  setupUpdateDetection() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service worker updated');
        this.showUpdateNotification();
      });

      // Check for updates periodically - but less frequently in test environments
      const checkInterval = this.isTestEnvironment ? 300000 : 60000; // 5 minutes vs 1 minute
      setInterval(() => {
        this.checkForUpdates();
      }, checkInterval);
    }
  }

  // Check for service worker updates
  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.update();
      }
    }
  }

  // Show update notification
  showUpdateNotification() {
    // In test environments, make notifications less intrusive
    if (this.isTestEnvironment) {
      console.log('📱 PWA update available (suppressed in test mode)');
      return;
    }
    
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div class="pwa-update-notification">
        <div class="pwa-update-content">
          <div class="pwa-update-icon">🔄</div>
          <div class="pwa-update-text">
            <div class="pwa-update-title">Update Available</div>
            <div class="pwa-update-subtitle">Refresh to get the latest version</div>
          </div>
          <button class="pwa-update-action" onclick="window.location.reload()">
            Refresh
          </button>
        </div>
      </div>
    `;

    // Add update notification styles
    const style = document.createElement('style');
    style.textContent = `
      .pwa-update-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        background: var(--color-accent);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        color: white;
        max-width: 300px;
        animation: slideInDown 0.3s ease-out;
        /* Ensure notifications don't interfere with navbar interactions */
        pointer-events: auto;
      }

      .pwa-update-content {
        display: flex;
        align-items: center;
        padding: 16px;
        gap: 12px;
      }

      .pwa-update-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .pwa-update-text {
        flex: 1;
      }

      .pwa-update-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 2px;
      }

      .pwa-update-subtitle {
        font-size: 12px;
        opacity: 0.9;
      }

      .pwa-update-action {
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        transition: background 0.2s ease;
      }

      .pwa-update-action:hover {
        background: rgba(255,255,255,0.3);
      }

      @keyframes slideInDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      notification.remove();
    }, 10000);
  }

  // Setup offline indicator
  setupOfflineIndicator() {
    window.addEventListener('online', () => {
      this.showConnectionStatus('online');
    });

    window.addEventListener('offline', () => {
      this.showConnectionStatus('offline');
    });
  }

  // Show connection status
  showConnectionStatus(status) {
    const indicator = document.createElement('div');
    indicator.className = `pwa-connection-indicator pwa-connection-${status}`;
    indicator.innerHTML = `
      <div class="pwa-connection-content">
        <div class="pwa-connection-icon">${status === 'online' ? '🟢' : '🔴'}</div>
        <div class="pwa-connection-text">
          ${status === 'online' ? 'Back online' : 'You\'re offline'}
        </div>
      </div>
    `;

    // Add connection indicator styles
    const style = document.createElement('style');
    style.textContent = `
      .pwa-connection-indicator {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1002;
        border-radius: 24px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        color: white;
        animation: slideInDown 0.3s ease-out;
      }

      .pwa-connection-online {
        background: #10b981;
      }

      .pwa-connection-offline {
        background: #ef4444;
      }

      .pwa-connection-content {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        gap: 8px;
      }

      .pwa-connection-icon {
        font-size: 12px;
      }

      .pwa-connection-text {
        font-size: 12px;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(indicator);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      indicator.remove();
    }, 3000);
  }

  // Setup push notifications
  setupPushNotifications() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      // Request permission on user interaction
      document.addEventListener('click', this.requestNotificationPermission, { once: true });
    }
  }

  async requestNotificationPermission() {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('📢 Notification permission:', permission);

      if (permission === 'granted') {
        this.subscribeToNotifications();
      }
    }
  }

  async subscribeToNotifications() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array('your-vapid-public-key')
        });

        console.log('📢 Push subscription created:', subscription);
        // Send subscription to server
        this.sendSubscriptionToServer(subscription);
      }
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }

  // Setup background sync
  setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('🔄 Background sync supported');

      // Register for background sync on form submissions
      this.setupFormSync();
    }
  }

  setupFormSync() {
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (form.dataset.sync === 'true') {
        e.preventDefault();

        // Store form data for background sync
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Store in IndexedDB for background sync
        await this.storeForSync('form-submission', data);

        // Register background sync
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.sync.register('form-submission');
        }

        this.showSyncNotification();
      }
    });
  }

  async storeForSync(type, data) {
    // Simple localStorage implementation (would use IndexedDB in production)
    const syncData = JSON.parse(localStorage.getItem('pwa-sync-data') || '[]');
    syncData.push({
      type,
      data,
      timestamp: Date.now(),
      id: Date.now().toString()
    });
    localStorage.setItem('pwa-sync-data', JSON.stringify(syncData));
  }

  showSyncNotification() {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div class="pwa-sync-notification">
        <div class="pwa-sync-content">
          <div class="pwa-sync-icon">⏳</div>
          <div class="pwa-sync-text">
            <div class="pwa-sync-title">Queued for Sync</div>
            <div class="pwa-sync-subtitle">Will send when online</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Track installation analytics
  trackInstallation(outcome = 'completed') {
    if (window.gtag) {
      window.gtag('event', 'pwa_install', {
        outcome: outcome,
        device_type: this.getDeviceType(),
        user_agent: navigator.userAgent
      });
    }
  }

  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Helper function for VAPID key conversion
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendSubscriptionToServer(subscription) {
    // Implementation would send to your backend
    console.log('📤 Would send subscription to server:', subscription);
  }

  // Get PWA status
  getStatus() {
    return {
      isInstalled: this.isInstalled,
      hasInstallPrompt: !!this.installPrompt,
      notificationPermission: Notification?.permission || 'unsupported',
      isOnline: navigator.onLine,
      supportsSync: 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }
}

// Initialize PWA enhancement
window.PWAEnhancer = new PWAEnhancer();
