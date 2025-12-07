import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import bcrypt from 'bcryptjs';

const app = new Hono();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(12),
  role: z.enum(['admin', 'surveyor', 'office', 'readonly']).default('surveyor'),
  phone: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'surveyor', 'office', 'readonly']).optional(),
  isActive: z.boolean().optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(12),
});

// Apply authentication to all routes
app.use('*', authenticate);

// GET /api/users - List team members
app.get('/', async (c) => {
  const user = c.get('user');

  const teamMembers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.accountId, user.accountId));

  return c.json({ users: teamMembers });
});

// POST /api/users - Create team member (admin only)
app.post('/', validate(createUserSchema), async (c) => {
  const user = c.get('user');
  const data = c.get('validatedData');

  // Check if user is admin
  if (user.role !== 'admin') {
    throw new AppError('Only admins can create users', 403);
  }

  // Check if email already exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email));

  if (existing) {
    throw new AppError('Email already in use', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      accountId: user.accountId,
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
      phone: data.phone,
      authProvider: 'local',
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });

  return c.json({ user: newUser }, 201);
});

// GET /api/users/profile - Get current user profile
app.get('/profile', async (c) => {
  const user = c.get('user');

  return c.json({ user });
});

// PUT /api/users/profile - Update current user profile
app.put('/profile', validate(updateProfileSchema), async (c) => {
  const user = c.get('user');
  const data = c.get('validatedData');

  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      accountId: users.accountId,
    });

  return c.json({ user: updated });
});

// POST /api/users/change-password - Change password
app.post('/change-password', validate(changePasswordSchema), async (c) => {
  const user = c.get('user');
  const data = c.get('validatedData');

  // Get user with password hash
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id));

  if (!currentUser.passwordHash) {
    throw new AppError('Cannot change password for SSO users', 400);
  }

  // Verify current password
  const isValid = await bcrypt.compare(data.currentPassword, currentUser.passwordHash);
  if (!isValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return c.json({ message: 'Password changed successfully' });
});

// GET /api/users/:id - Get team member
app.get('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  const [teamMember] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        eq(users.id, id),
        eq(users.accountId, user.accountId)
      )
    );

  if (!teamMember) {
    throw new AppError('User not found', 404);
  }

  return c.json({ user: teamMember });
});

// PUT /api/users/:id - Update team member (admin only)
app.put('/:id', validate(updateUserSchema), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedData');

  // Check if user is admin
  if (user.role !== 'admin') {
    throw new AppError('Only admins can update users', 403);
  }

  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, id),
        eq(users.accountId, user.accountId)
      )
    )
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      phone: users.phone,
      isActive: users.isActive,
    });

  if (!updated) {
    throw new AppError('User not found', 404);
  }

  return c.json({ user: updated });
});

// DELETE /api/users/:id - Deactivate team member (admin only)
app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  // Check if user is admin
  if (user.role !== 'admin') {
    throw new AppError('Only admins can deactivate users', 403);
  }

  // Cannot deactivate yourself
  if (id === user.id) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  const [updated] = await db
    .update(users)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, id),
        eq(users.accountId, user.accountId)
      )
    )
    .returning();

  if (!updated) {
    throw new AppError('User not found', 404);
  }

  return c.json({ message: 'User deactivated successfully' });
});

export default app;
