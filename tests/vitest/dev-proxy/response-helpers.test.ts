/**
 * Unit tests for dev-proxy response helpers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendErrorResponse,
  sendSuccessResponse,
  setCORSHeaders,
} from '../../../src/lib/dev-proxy/response-helpers.js';

describe('response-helpers', () => {
  let mockRes: {
    statusCode: number;
    headers: Record<string, string>;
    setHeader: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRes = {
      statusCode: 200,
      headers: {},
      setHeader: vi.fn((name: string, value: string) => {
        mockRes.headers[name] = value;
      }),
      end: vi.fn((_data: string) => {
        // Mock implementation
      }),
    };
  });

  describe('sendErrorResponse', () => {
    it('should set correct status code', () => {
      sendErrorResponse(mockRes, 400, 'Bad Request');
      expect(mockRes.statusCode).toBe(400);
    });

    it('should set Content-Type header', () => {
      sendErrorResponse(mockRes, 404, 'Not Found');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json; charset=utf-8'
      );
    });

    it('should send error message in JSON format', () => {
      sendErrorResponse(mockRes, 500, 'Internal Server Error');
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Internal Server Error' }));
    });

    it('should handle different status codes', () => {
      const statusCodes = [400, 401, 403, 404, 500, 502, 503];
      statusCodes.forEach((code) => {
        const res = {
          statusCode: 200,
          headers: {},
          setHeader: vi.fn(),
          end: vi.fn(),
        };
        sendErrorResponse(res, code, 'Error');
        expect(res.statusCode).toBe(code);
      });
    });
  });

  describe('sendSuccessResponse', () => {
    it('should set status code to 200', () => {
      sendSuccessResponse(mockRes, { message: 'Success' });
      expect(mockRes.statusCode).toBe(200);
    });

    it('should set Content-Type header', () => {
      sendSuccessResponse(mockRes, { data: 'test' });
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json; charset=utf-8'
      );
    });

    it('should send data in JSON format', () => {
      const data = { message: 'Hello', sources: [] };
      sendSuccessResponse(mockRes, data);
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(data));
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        message: 'Success',
        sources: [
          { title: 'Source 1', url: '/path1' },
          { title: 'Source 2', url: '/path2', snippet: 'Snippet' },
        ],
      };
      sendSuccessResponse(mockRes, complexData);
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(complexData));
    });
  });

  describe('setCORSHeaders', () => {
    it('should set CORS headers with provided origin', () => {
      setCORSHeaders(mockRes, 'https://example.com');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://example.com'
      );
    });

    it('should use wildcard when origin is undefined', () => {
      setCORSHeaders(mockRes, undefined);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    });

    it('should set all required CORS headers', () => {
      setCORSHeaders(mockRes, 'https://example.com');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://example.com'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'POST, OPTIONS'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        'content-type, authorization'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith('Vary', 'Origin');
    });

    it('should set correct number of headers', () => {
      setCORSHeaders(mockRes, 'https://example.com');
      expect(mockRes.setHeader).toHaveBeenCalledTimes(5);
    });
  });
});
