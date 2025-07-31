/**
 * Module-specific error handling utilities
 * Provides convenient error handling patterns for common module scenarios
 */

import { AppError, ErrorType, ErrorSeverity, ErrorContext, createModuleError, handleError } from './AppError';

/**
 * Standardized error handling for module initialization
 */
export function handleModuleInitError(
  moduleName: string,
  error: unknown,
  context: Partial<ErrorContext> = {}
): void {
  const appError = createModuleError(
    moduleName,
    'MODULE_INIT_ERROR',
    `Failed to initialize ${moduleName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    {
      ...context,
      component: 'ModuleInitializer',
      action: 'initialize'
    }
  );
  handleError(appError);
}

/**
 * Standardized error handling for API/network requests
 */
export function handleNetworkError(
  moduleName: string,
  url: string,
  error: unknown,
  context: Partial<ErrorContext> = {}
): AppError {
  const appError = new AppError(
    ErrorType.NETWORK,
    'NETWORK_REQUEST_ERROR',
    `Network request failed for ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    'Connection failed. Please check your internet connection.',
    ErrorSeverity.MEDIUM,
    {
      ...context,
      module: moduleName,
      url,
      component: 'NetworkRequest'
    },
    true
  );
  handleError(appError);
  return appError;
}

/**
 * Standardized error handling for form validation
 */
export function handleValidationError(
  moduleName: string,
  fieldName: string,
  message: string,
  context: Partial<ErrorContext> = {}
): AppError {
  const appError = new AppError(
    ErrorType.VALIDATION,
    'FIELD_VALIDATION_ERROR',
    `Validation failed for ${fieldName}: ${message}`,
    message,
    ErrorSeverity.LOW,
    {
      ...context,
      module: moduleName,
      component: 'FieldValidation',
      additionalData: { fieldName }
    },
    true
  );
  handleError(appError);
  return appError;
}

/**
 * Standardized error handling for resource loading
 */
export function handleResourceError(
  moduleName: string,
  resourceType: string,
  resourceUrl: string,
  error: unknown,
  context: Partial<ErrorContext> = {}
): void {
  const appError = new AppError(
    ErrorType.RESOURCE,
    'RESOURCE_LOAD_ERROR',
    `Failed to load ${resourceType}: ${resourceUrl} - ${error instanceof Error ? error.message : 'Unknown error'}`,
    `Failed to load ${resourceType}. Some features may not work properly.`,
    ErrorSeverity.LOW,
    {
      ...context,
      module: moduleName,
      url: resourceUrl,
      component: 'ResourceLoader',
      additionalData: { resourceType }
    },
    true
  );
  handleError(appError);
}

/**
 * Wrapper for async operations with standardized error handling
 */
export async function withErrorHandling<T>(
  moduleName: string,
  operation: () => Promise<T>,
  operationName: string,
  context: Partial<ErrorContext> = {}
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const appError = createModuleError(
      moduleName,
      'ASYNC_OPERATION_ERROR',
      `Async operation '${operationName}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        ...context,
        action: operationName,
        additionalData: { operationType: 'async' }
      }
    );
    handleError(appError);
    return null;
  }
}

/**
 * Wrapper for synchronous operations with standardized error handling
 */
export function withSyncErrorHandling<T>(
  moduleName: string,
  operation: () => T,
  operationName: string,
  context: Partial<ErrorContext> = {}
): T | null {
  try {
    return operation();
  } catch (error) {
    const appError = createModuleError(
      moduleName,
      'SYNC_OPERATION_ERROR',
      `Synchronous operation '${operationName}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        ...context,
        action: operationName,
        additionalData: { operationType: 'sync' }
      }
    );
    handleError(appError);
    return null;
  }
}

/**
 * Utility for DOM element not found errors
 */
export function handleElementNotFoundError(
  moduleName: string,
  selector: string,
  context: Partial<ErrorContext> = {}
): AppError {
  const appError = createModuleError(
    moduleName,
    'ELEMENT_NOT_FOUND',
    `Required DOM element not found: ${selector}`,
    {
      ...context,
      component: 'DOMQuery',
      additionalData: { selector }
    }
  );
  handleError(appError);
  return appError;
}

/**
 * Utility for configuration errors
 */
export function handleConfigurationError(
  moduleName: string,
  configKey: string,
  expectedType: string,
  actualValue: unknown,
  context: Partial<ErrorContext> = {}
): AppError {
  const appError = createModuleError(
    moduleName,
    'CONFIGURATION_ERROR',
    `Invalid configuration for '${configKey}': expected ${expectedType}, got ${typeof actualValue}`,
    {
      ...context,
      component: 'Configuration',
      additionalData: { configKey, expectedType, actualType: typeof actualValue }
    }
  );
  handleError(appError);
  return appError;
}

/**
 * Error reporter for analytics and monitoring
 */
export class ModuleErrorReporter {
  private moduleName: string;
  private baseContext: ErrorContext;

  constructor(moduleName: string, baseContext: Partial<ErrorContext> = {}) {
    this.moduleName = moduleName;
    this.baseContext = {
      module: moduleName,
      ...baseContext
    };
  }

  reportError(
    code: string,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    additionalContext: Partial<ErrorContext> = {}
  ): void {
    const appError = createModuleError(
      this.moduleName,
      code,
      message,
      {
        ...this.baseContext,
        ...additionalContext
      }
    );
    
    // Override severity if provided
    (appError as any).severity = severity;
    
    handleError(appError);
  }

  reportNetworkError(url: string, error: unknown): void {
    handleNetworkError(this.moduleName, url, error, this.baseContext);
  }

  reportValidationError(fieldName: string, message: string): void {
    handleValidationError(this.moduleName, fieldName, message, this.baseContext);
  }

  reportResourceError(resourceType: string, resourceUrl: string, error: unknown): void {
    handleResourceError(this.moduleName, resourceType, resourceUrl, error, this.baseContext);
  }

  withErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    additionalContext: Partial<ErrorContext> = {}
  ): Promise<T | null> {
    return withErrorHandling(
      this.moduleName,
      operation,
      operationName,
      { ...this.baseContext, ...additionalContext }
    );
  }
}

/**
 * Factory function to create module-specific error reporter
 */
export function createModuleErrorReporter(
  moduleName: string,
  baseContext: Partial<ErrorContext> = {}
): ModuleErrorReporter {
  return new ModuleErrorReporter(moduleName, baseContext);
}
