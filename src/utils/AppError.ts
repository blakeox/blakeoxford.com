/**
 * Centralized Application Error System
 * Standardizes error handling across all modules
 */

export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  JAVASCRIPT = 'javascript',
  RESOURCE = 'resource',
  FORM = 'form',
  MODULE = 'module',
  SEARCH = 'search',
  NAVIGATION = 'navigation',
  ANALYTICS = 'analytics'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  module?: string;
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  additionalData?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly recoverable: boolean;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly timestamp: string;
  public readonly id: string;

  constructor(
    type: ErrorType,
    code: string,
    technicalMessage: string,
    userMessage?: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {},
    recoverable: boolean = true
  ) {
    super(technicalMessage);
    
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.technicalMessage = technicalMessage;
    this.userMessage = userMessage || this.getDefaultUserMessage(type);
    this.context = {
      ...context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };
    this.recoverable = recoverable;
    this.timestamp = new Date().toISOString();
    this.id = this.generateErrorId();
    
    this.name = 'AppError';
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private generateErrorId(): string {
    return `${this.type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  private getDefaultUserMessage(type: ErrorType): string {
    const messages = {
      [ErrorType.VALIDATION]: 'Please check your input and try again.',
      [ErrorType.NETWORK]: 'Connection failed. Please check your internet connection.',
      [ErrorType.JAVASCRIPT]: 'An unexpected error occurred. Please refresh the page.',
      [ErrorType.RESOURCE]: 'Failed to load content. Some features may not work properly.',
      [ErrorType.FORM]: 'Form submission failed. Please try again.',
      [ErrorType.MODULE]: 'A feature failed to load properly.',
      [ErrorType.SEARCH]: 'Search functionality is temporarily unavailable.',
      [ErrorType.NAVIGATION]: 'Navigation error occurred.',
      [ErrorType.ANALYTICS]: 'Analytics tracking encountered an issue.'
    };
    
    return messages[type] || 'An error occurred. Please try again.';
  }

  /**
   * Convert to a plain object for logging/reporting
   */
  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      severity: this.severity,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      context: this.context,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * Check if error should be reported to external services
   */
  public shouldReport(): boolean {
    return this.severity === ErrorSeverity.HIGH || this.severity === ErrorSeverity.CRITICAL;
  }

  /**
   * Check if error should be shown to user
   */
  public shouldShowToUser(): boolean {
    return this.recoverable && this.severity !== ErrorSeverity.LOW;
  }
}

/**
 * Error Factory - convenient methods for creating common errors
 */
export class ErrorFactory {
  static validation(
    code: string,
    message: string,
    context: ErrorContext = {}
  ): AppError {
    return new AppError(
      ErrorType.VALIDATION,
      code,
      message,
      undefined,
      ErrorSeverity.LOW,
      context,
      true
    );
  }

  static network(
    code: string,
    message: string,
    context: ErrorContext = {}
  ): AppError {
    return new AppError(
      ErrorType.NETWORK,
      code,
      message,
      undefined,
      ErrorSeverity.MEDIUM,
      context,
      true
    );
  }

  static module(
    moduleName: string,
    code: string,
    message: string,
    context: ErrorContext = {}
  ): AppError {
    return new AppError(
      ErrorType.MODULE,
      code,
      message,
      undefined,
      ErrorSeverity.MEDIUM,
      { ...context, module: moduleName },
      true
    );
  }

  static search(
    code: string,
    message: string,
    context: ErrorContext = {}
  ): AppError {
    return new AppError(
      ErrorType.SEARCH,
      code,
      message,
      undefined,
      ErrorSeverity.LOW,
      context,
      true
    );
  }

  static critical(
    type: ErrorType,
    code: string,
    message: string,
    context: ErrorContext = {}
  ): AppError {
    return new AppError(
      type,
      code,
      message,
      undefined,
      ErrorSeverity.CRITICAL,
      context,
      false
    );
  }
}

/**
 * Centralized Error Handler
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorDisplay?: any; // Reference to existing ErrorHandlingSystem

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Initialize with existing error display system
   */
  public initialize(errorDisplay: any): void {
    this.errorDisplay = errorDisplay;
  }

  /**
   * Handle application errors with consistent logging and reporting
   */
  public handle(error: AppError | Error): void {
    let appError: AppError;

    // Convert regular errors to AppError
    if (!(error instanceof AppError)) {
      appError = new AppError(
        ErrorType.JAVASCRIPT,
        'UNEXPECTED_ERROR',
        error.message,
        undefined,
        ErrorSeverity.MEDIUM,
        { additionalData: { originalError: error.name } }
      );
    } else {
      appError = error;
    }

    // Always log to console with structured format
    this.logError(appError);

    // Report critical errors to external services if needed
    if (appError.shouldReport()) {
      this.reportError(appError);
    }

    // Show to user if appropriate
    if (appError.shouldShowToUser() && this.errorDisplay) {
      this.showErrorToUser(appError);
    }
  }

  private logError(error: AppError): void {
    const logData = {
      id: error.id,
      type: error.type,
      code: error.code,
      severity: error.severity,
      message: error.technicalMessage,
      context: error.context
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.LOW:
        console.info('ℹ️ LOW SEVERITY ERROR:', logData);
        break;
    }
  }

  private reportError(error: AppError): void {
    // Integration point for external error reporting services
    // (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined' && (window as any).errorReporting) {
      (window as any).errorReporting.report(error.toJSON());
    }
  }

  private showErrorToUser(error: AppError): void {
    if (this.errorDisplay && this.errorDisplay.handleError) {
      this.errorDisplay.handleError({
        type: error.type,
        message: error.userMessage,
        details: error.technicalMessage,
        severity: error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH ? 'error' : 'warning',
        actions: error.recoverable ? [
          { label: 'Retry', action: () => window.location.reload() }
        ] : undefined
      });
    }
  }
}

/**
 * Convenient helper functions for common error scenarios
 */
export const handleError = (error: AppError | Error): void => {
  ErrorHandler.getInstance().handle(error);
};

export const createValidationError = (code: string, message: string, context?: ErrorContext): AppError => {
  return ErrorFactory.validation(code, message, context);
};

export const createNetworkError = (code: string, message: string, context?: ErrorContext): AppError => {
  return ErrorFactory.network(code, message, context);
};

export const createModuleError = (moduleName: string, code: string, message: string, context?: ErrorContext): AppError => {
  return ErrorFactory.module(moduleName, code, message, context);
};

// Auto-initialize error handler
if (typeof window !== 'undefined') {
  // Wait for existing error handling system to be available
  const initErrorHandler = () => {
    const existingErrorSystem = (window as any).errorHandlingSystem;
    if (existingErrorSystem) {
      ErrorHandler.getInstance().initialize(existingErrorSystem);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initErrorHandler);
  } else {
    // Delay to allow other systems to initialize
    setTimeout(initErrorHandler, 100);
  }
}
