/**
 * Observability Integration Example
 * Demonstrates how to use the complete observability system
 */

import { getObservabilityOrchestrator } from '../utils/ObservabilityOrchestrator';
import { ErrorHandler } from '../utils/AppError';

/**
 * Initialize complete observability system
 */
export async function initializeObservability() {
  console.log('🚀 Initializing Complete Observability System...');

  try {
    // Initialize the Observability Orchestrator
    const orchestrator = getObservabilityOrchestrator({
      environment: 'development',
      debugMode: true,
      autoStart: true,
      samplingRates: {
        performance: 1.0,  // 100% in development
        security: 1.0,     // 100% in development  
        analytics: 1.0     // 100% in development
      }
    });

    // Initialize the orchestrator (this coordinates all systems)
    await orchestrator.initialize();

    // Get system status and health
    const status = orchestrator.getStatus();
    console.log('📊 Observability System Status:', status);

    // Get real-time health metrics
    const health = orchestrator.getSystemHealth();
    console.log('💚 System Health:', health);

    console.log('✅ Complete Observability System Initialized Successfully!');
    
    return orchestrator;

  } catch (error) {
    console.error('❌ Failed to initialize observability system:', error);
    throw error;
  }
}

/**
 * Demonstrate error handling with cross-system integration
 */
function demonstrateErrorHandling() {
  console.log('🧪 Demonstrating Integrated Error Handling...');

  const errorHandler = ErrorHandler.getInstance();

  try {
    // Simulate various types of errors that will be automatically 
    // reported to appropriate monitoring systems
    
    // Performance-related error
    throw new Error('Slow API response detected: 5000ms timeout exceeded');
    
  } catch (error) {
    // This will automatically:
    // - Generate correlation ID  
    // - Report to PerformanceMonitor (detected as performance-related)
    // - Log structured error data
    // - Update system health metrics
    errorHandler.handle(error as Error);
  }

  try {
    // Security-related error
    throw new Error('Suspicious login attempt from unknown IP: 192.168.1.1');
    
  } catch (error) {
    // This will automatically:
    // - Generate correlation ID
    // - Report to SecurityMonitor (detected as security-related)
    // - Trigger security event logging
    // - Update threat metrics
    errorHandler.handle(error as Error);
  }
}

/**
 * Demonstrate real-time monitoring coordination
 */
function demonstrateMonitoringCoordination() {
  console.log('🔍 Demonstrating Real-time Monitoring Coordination...');

  const orchestrator = getObservabilityOrchestrator();
  
  // Get coordinated metrics from all systems
  const health = orchestrator.getSystemHealth();
  
  console.log('Performance Status:', health.performance.status);
  console.log('Security Status:', health.security.status);
  console.log('Error Status:', health.errors.status);
  console.log('Resource Status:', health.resources.status);

  // Get system status
  const status = orchestrator.getStatus();
  console.log('Initialized Systems:', status.systems);
  console.log('Environment:', status.config.environment);
  console.log('Sampling Rates:', status.config.samplingRates);
}

/**
 * Auto-initialize observability when script loads
 */
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await initializeObservability();
      
      // Optional: Run demonstrations
      if (window.location.search.includes('debug=true')) {
        setTimeout(() => {
          demonstrateErrorHandling();
          demonstrateMonitoringCoordination();
        }, 2000);
      }
    });
  } else {
    initializeObservability();
  }
}
