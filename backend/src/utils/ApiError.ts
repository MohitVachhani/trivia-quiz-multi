/**
 * Custom API Error class for consistent error handling
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(code: string, message: string): ApiError {
    return new ApiError(400, code, message);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(code: string = 'UNAUTHORIZED', message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, code, message);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(code: string = 'FORBIDDEN', message: string = 'Forbidden'): ApiError {
    return new ApiError(403, code, message);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(code: string = 'NOT_FOUND', message: string = 'Resource not found'): ApiError {
    return new ApiError(404, code, message);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(code: string, message: string): ApiError {
    return new ApiError(409, code, message);
  }

  /**
   * Create a 500 Internal Server error
   */
  static internal(code: string = 'INTERNAL_ERROR', message: string = 'Internal server error'): ApiError {
    return new ApiError(500, code, message);
  }
}
