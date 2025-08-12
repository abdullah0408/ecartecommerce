/**
 * Base class for application-specific errors.
 * Extends the built-in Error class to add HTTP status code,
 * operational flag, and optional additional details.
 */
export class AppError extends Error {
  // HTTP status code to be sent in the response
  public readonly statusCode: number;
  // Indicates if the error is operational (expected) or a programmer error
  public readonly isOperational: boolean;
  // Optional additional error details (e.g. validation errors)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly details?: any;

  /**
   * Create a new AppError instance.
   *
   * @param message - Error message string
   * @param statusCode - HTTP status code (e.g., 400, 404, 500)
   * @param isOperational - Whether this is an operational error (default: true)
   * @param details - Optional additional error details (any type)
   */
  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any
  ) {
    super(message); // Call base Error constructor with message
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Capture stack trace for better debugging (exclude constructor call itself)
    Error.captureStackTrace(this);
  }
}

// Error representing a resource not found (HTTP 404).
export class NotFoundError extends AppError {
  /**
   * Create a NotFoundError.
   * @param message - Custom error message (default: 'Resource not found')
   */
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

// Error representing a validation failure (HTTP 400).
export class ValidationError extends AppError {
  /**
   * Create a ValidationError.
   *
   * @param message - Custom error message (default: 'Invalid request data')
   * @param details - Optional details about validation errors (e.g., field errors)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message = 'Invalid request data', details?: any) {
    super(message, 400, true, details);
  }
}

// Error representing an unauthorized access attempt (HTTP 401).
export class AuthError extends AppError {
  /**
   * Create an AuthError.
   * @param message - Custom error message (default: 'Unauthorized')
   */
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

// Error representing forbidden access (HTTP 403).
export class ForbiddenError extends AppError {
  /**
   * Create a ForbiddenError.
   * @param message - Custom error message (default: 'Forbidden access')
   */
  constructor(message = 'Forbidden access') {
    super(message, 403);
  }
}

// Error representing a database failure (HTTP 500).
export class DatabaseError extends AppError {
  /**
   * Create a DatabaseError.
   *
   * @param message - Custom error message (default: 'Database error')
   * @param details - Optional additional details about the database error
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message = 'Database error', details?: any) {
    super(message, 500, true, details);
  }
}

// Error representing rate limiting (HTTP 429).
export class RateLimitError extends AppError {
  /**
   * Create a RateLimitError.
   * @param message - Custom error message (default: 'Too many requests, please try again later')
   */
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429);
  }
}
