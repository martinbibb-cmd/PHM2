import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import bcrypt from 'bcrypt';
import { db, users, accounts } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { validateBody } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { UnauthorizedError, ConflictError, ValidationError } from '../utils/errors.js';
import { loginSchema, registerSchema } from '@phm/shared';
import type { LoginRequest, RegisterRequest, User } from '@phm/shared';
import { logger } from '../utils/logger.js';

const auth = new Hono();

// POST /api/auth/register - Create new account and user
auth.post('/register', validateBody(registerSchema), async (c) => {
  const data = c.get('validatedBody') as RegisterRequest;

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Create account and user in a transaction
  const result = await db.transaction(async (tx) => {
    // Create account
    const [account] = await tx.insert(accounts).values({
      name: data.accountName,
      plan: 'free',
      isActive: true,
    }).returning();

    // Create user
    const [user] = await tx.insert(users).values({
      accountId: account.id,
      email: data.email,
      name: data.name,
      passwordHash,
      role: 'admin', // First user is admin
      isActive: true,
    }).returning();

    return { account, user };
  });

  logger.info({ userId: result.user.id, accountId: result.account.id }, 'User registered');

  // Generate tokens
  const accessToken = generateAccessToken(result.user);
  const refreshToken = generateRefreshToken(result.user);

  // Set httpOnly cookies
  setCookie(c, 'accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
  });

  setCookie(c, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = result.user;

  return c.json({
    data: {
      user: userWithoutPassword,
      accessToken,
    },
    message: 'Registration successful',
  }, 201);
});

// POST /api/auth/login - Login with email and password
auth.post('/login', validateBody(loginSchema), async (c) => {
  const data = c.get('validatedBody') as LoginRequest;

  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login
  await db.update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  logger.info({ userId: user.id }, 'User logged in');

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Set httpOnly cookies
  setCookie(c, 'accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
  });

  setCookie(c, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;

  return c.json({
    data: {
      user: userWithoutPassword,
      accessToken,
    },
    message: 'Login successful',
  });
});

// POST /api/auth/logout - Logout user
auth.post('/logout', authMiddleware, async (c) => {
  const user = c.get('user');

  logger.info({ userId: user.userId }, 'User logged out');

  // Clear cookies
  deleteCookie(c, 'accessToken');
  deleteCookie(c, 'refreshToken');

  return c.json({
    message: 'Logout successful',
  });
});

// GET /api/auth/me - Get current user
auth.get('/me', authMiddleware, async (c) => {
  const jwtUser = c.get('user');

  // Fetch fresh user data
  const user = await db.query.users.findFirst({
    where: eq(users.id, jwtUser.userId),
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('User not found or inactive');
  }

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;

  return c.json({
    data: userWithoutPassword,
  });
});

// POST /api/auth/refresh - Refresh access token
auth.post('/refresh', async (c) => {
  const refreshToken = c.req.header('X-Refresh-Token') || '';

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token not provided');
  }

  const payload = verifyRefreshToken(refreshToken);

  // Fetch user to ensure still active
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('User not found or inactive');
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Set new cookies
  setCookie(c, 'accessToken', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
  });

  setCookie(c, 'refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
  });

  return c.json({
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});

export default auth;
