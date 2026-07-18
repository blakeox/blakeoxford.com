/**
 * Response helpers for development proxy
 * Provides consistent error and success response formatting
 */

/**
 * Send an error response with consistent format
 */
export function sendErrorResponse(
  res: {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (data: string) => void;
  },
  statusCode: number,
  message: string
): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: message }));
}

/**
 * Send a success response with data
 */
export function sendSuccessResponse(
  res: {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (data: string) => void;
  },
  data: unknown
): void {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

/**
 * Set CORS headers for the response
 */
export function setCORSHeaders(
  res: { setHeader: (name: string, value: string) => void },
  origin: string | undefined
): void {
  const allowedOrigin = origin ?? '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
  res.setHeader('Vary', 'Origin');
}
