import * as Sentry from '@sentry/astro';
import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * React Error Boundary with Sentry integration
 * Catches errors in React component tree and reports to Sentry
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to Sentry with React context
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
          componentName: this.props.componentName || 'Unknown',
        },
      },
      tags: {
        errorBoundary: this.props.componentName || 'generic',
      },
    });
    
    // Keep console.error for development debugging
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise show default error UI
      return this.props.fallback || (
        <div 
          className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-red-600 dark:text-red-400">
            Something went wrong. Please refresh the page or try again later.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-2 text-left">
              <summary className="cursor-pointer text-xs text-red-500">
                Error details (dev only)
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-red-950/50 p-2 text-xs text-red-300">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
