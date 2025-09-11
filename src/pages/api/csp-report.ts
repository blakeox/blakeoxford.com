/**
 * CSP Report API Endpoint
 * Handles Content Security Policy violation reports
 */

export async function POST({ request }: { request: Request }) {
  try {
    const cspReport = await request.json();
    
    // Log CSP violation
    console.warn('🛡️ CSP Violation Reported:', {
      documentUri: cspReport['csp-report']?.['document-uri'],
      violatedDirective: cspReport['csp-report']?.['violated-directive'],
      blockedUri: cspReport['csp-report']?.['blocked-uri'],
      effectiveDirective: cspReport['csp-report']?.['effective-directive'],
      originalPolicy: cspReport['csp-report']?.['original-policy'],
      referrer: cspReport['csp-report']?.referrer,
      statusCode: cspReport['csp-report']?.['status-code'],
      sourceFile: cspReport['csp-report']?.['source-file'],
      lineNumber: cspReport['csp-report']?.['line-number'],
      columnNumber: cspReport['csp-report']?.['column-number'],
      sample: cspReport['csp-report']?.['script-sample'],
      timestamp: new Date().toISOString(),
      ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent')
    });
    
    // In a real implementation, you would:
    // 1. Store in database/logging service
    // 2. Analyze patterns to identify potential attacks
    // 3. Update CSP policy if needed
    // 4. Alert security team for suspicious patterns
    
    // Acknowledge receipt
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'CSP violation recorded',
      reportId: `csp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error processing CSP report:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to process CSP report' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
