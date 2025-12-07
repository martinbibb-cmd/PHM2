import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyAccessToken, type JwtPayload } from '../lib/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

// Extend Hono's Context to include user
declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  // Try to get token from Authorization header first
  const authHeader = c.req.header('Authorization');
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Fallback to cookie
    token = getCookie(c, 'accessToken');
  }

  if (!token) {
    throw new UnauthorizedError('No authentication token provided');
  }

  try {
    const payload = verifyAccessToken(token);
    c.set('user', payload);
    await next();
  } catch (error) {
    throw error; // Let error handler deal with it
  }
}

export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    await next();
  };
}

export function requireAccountAccess(c: Context): number {
  const user = c.get('user');

  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  return user.accountId;
}
