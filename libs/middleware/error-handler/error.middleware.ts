import { AppError } from './index';
import { NextFunction, Request, Response } from 'express';

/**
 * Express error-handling middleware.
 *
 * This middleware handles errors thrown during request processing.
 * It distinguishes between operational errors (instances of AppError)
 * and unexpected errors, and sends an appropriate JSON response.
 *
 * @param {Error} error - The error object caught by Express.
 *                        This is typed as the base Error class but
 *                        can be an instance of any subclass such as AppError.
 * @param {Request} request - The incoming Express request.
 * @param {Response} response - The Express response object.
 * @param {NextFunction} next - The next middleware function
 *                        (unused here, but required for Express to recognize
 *                        this as an error handler).
 *
 * @returns {Response} Sends JSON response with error details.
 *
 * @note
 * The 'error' parameter is typed as the base Error class because Express expects
 * error handlers to accept any Error instance. However, it can also be a subclass
 * instance like AppError, which has additional properties like statusCode.
 *
 * In TypeScript, subclass instances can be assigned to variables typed as their
 * superclass. For example:
 *
 * ```ts
 * class A { a: number; }
 * class B extends A { b: string; }
 * const b = new B();
 * const a: A = b; // ✅ Allowed — subclass instance assigned to superclass variable
 * ```
 *
 * This principle explains why we can safely check 'error instanceof AppError'
 * to access subclass-specific properties.
 */
export const errorMiddleware = (
  error: Error,
  request: Request,
  response: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Check if error is an instance of AppError (our custom error class)
  if (error instanceof AppError) {
    // Log the error method, url, and message for debugging
    console.error(`Error ${request.method} ${request.url}: ${error.message}`);

    // Respond with the specific HTTP status code and error message,
    // including any additional details if provided
    return response.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      ...(error.details && { details: error.details }),
    });
  }

  // If error is not an AppError, treat it as an unexpected error
  console.error(`Unexpected error ${request.method} ${request.url}:`, error);

  // Send generic 500 Internal Server Error response without exposing details
  return response.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
