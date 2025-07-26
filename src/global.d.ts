// Suppress TypeScript errors for Astro virtual modules
declare module 'astro:content';

declare module 'astro/components';

// Browser globals for TypeScript
declare global {
  interface Window {
    LazyBundleLoader?: import('./scripts/utils/LazyLoader').LazyBundleLoader;
    AccessibilityModule?: typeof import('./scripts/modules/AccessibilityModule').AccessibilityModule;
    initAccessibilityModule?: typeof import('./scripts/modules/AccessibilityModule').initAccessibilityModule;
    accessibilityModule?: import('./scripts/modules/AccessibilityModule').AccessibilityModule;
    analyticsModule?: import('./scripts/modules/AnalyticsModule').AnalyticsModule;
    scrollEffects?: import('./scripts/utils/ScrollEffects').ScrollEffects;
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
    fathom?: { trackEvent: (eventName: string, data: Record<string, unknown>) => void };
    clarity?: (action: string, eventName: string, data: Record<string, unknown>) => void;
  }
  
  // Speech Recognition types - only declare if not already defined
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    serviceURI: string;
    start(): void;
    stop(): void;
    abort(): void;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onerror: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onnomatch: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  }
  
  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }
  
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }
  
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }
  
  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }
  
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  
  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };
  
  var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };
  
  // Network Information API
  interface NetworkInformation extends EventTarget {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  }
  
  // Battery Manager API
  interface BatteryManager extends EventTarget {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
  }
}

export {};
