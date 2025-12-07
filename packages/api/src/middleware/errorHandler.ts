import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AppError, formatErrorResponse } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export async function errorHandler(err: Error, c: Context) {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  // Determine status code
  let statusCode = 500;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
  } else if (err instanceof HTTPException) {
    statusCode = err.status;
  }

  // Format and return error response
  return c.json(formatErrorResponse(err), statusCode);
}
