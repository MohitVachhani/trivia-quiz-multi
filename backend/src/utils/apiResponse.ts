import { Response } from 'express';

/**
 * Standard success response format
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Send a success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400
): Response {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  return res.status(statusCode).json(response);
}
