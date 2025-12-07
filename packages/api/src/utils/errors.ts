import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, message, details);
    this.name = 'ConflictError';
  }
}

export function formatErrorResponse(error: any) {
  if (error instanceof AppError) {
    return {
      error: error.name,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof HTTPException) {
    return {
      error: 'HTTPException',
      message: error.message,
    };
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return {
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
    };
  }

  return {
    error: error.name || 'Error',
    message: error.message || 'An unexpected error occurred',
    stack: error.stack,
  };
}
