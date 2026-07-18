/**
 * Performance Alert API Endpoint
 * Handles performance alert reporting from advanced performance monitor
 */

import type { PerformanceAlert } from '../../types/api';

export function GET(): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed',
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        Allow: 'POST',
      },
    }
  );
}

export async function POST({ request }: { request: Request }): Promise<Response> {
  try {
    const performanceAlert = (await request.json()) as PerformanceAlert;

    // Log performance alert
    console.warn('⚡ Performance Alert Reported:', {
      type: performanceAlert.type,
      severity: performanceAlert.severity,
      timestamp: new Date(performanceAlert.timestamp).toISOString(),
      metric: performanceAlert.metric,
      value: performanceAlert.value,
      threshold: performanceAlert.threshold,
      message: performanceAlert.message,
      recommendation: performanceAlert.recommendation,
      ip:
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for') ||
        'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    // In a real implementation, you would:
    // 1. Store in performance monitoring database
    // 2. Trigger alerts for development team
    // 3. Update performance dashboards
    // 4. Correlate with deployment events
    // 5. Generate performance reports

    // Acknowledge receipt
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Performance alert recorded',
        alertId: `perf-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing performance alert:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process performance alert',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
