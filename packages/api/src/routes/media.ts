import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { mediaAttachments, visitSessions } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { eq, and, desc } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const app = new Hono();

// Upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
await fs.mkdir(UPLOAD_DIR, { recursive: true });
await fs.mkdir(path.join(UPLOAD_DIR, 'photos'), { recursive: true });
await fs.mkdir(path.join(UPLOAD_DIR, 'documents'), { recursive: true });
await fs.mkdir(path.join(UPLOAD_DIR, 'thumbnails'), { recursive: true });

// Validation schemas
const annotateSchema = z.object({
  caption: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Apply authentication to all routes
app.use('*', authenticate);

// POST /api/media/upload - Upload photo/document
app.post('/upload', async (c) => {
  const user = c.get('user');
  const body = await c.req.parseBody();

  const visitSessionId = body.visitSessionId ? parseInt(body.visitSessionId as string) : null;
  const moduleId = body.moduleId ? parseInt(body.moduleId as string) : null;
  const fileType = (body.fileType as string) || 'photo';
  const caption = (body.caption as string) || '';

  if (!visitSessionId) {
    throw new AppError('Visit session ID is required', 400);
  }

  // Verify visit session belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, visitSessionId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  const file = body.file as File;
  if (!file) {
    throw new AppError('No file provided', 400);
  }

  // Generate unique filename
  const ext = path.extname(file.name);
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const subDir = fileType === 'photo' ? 'photos' : 'documents';
  const filePath = path.join(UPLOAD_DIR, subDir, uniqueName);

  // Save file
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(filePath, buffer);

  // Get file stats
  const stats = await fs.stat(filePath);

  // Create database entry
  const [media] = await db
    .insert(mediaAttachments)
    .values({
      visitSessionId,
      moduleId,
      fileType,
      fileName: file.name,
      filePath: filePath,
      fileSize: stats.size,
      mimeType: file.type,
      caption,
      metadata: {},
    })
    .returning();

  return c.json({ media }, 201);
});

// GET /api/media/:visitSessionId - Get all media for session
app.get('/:visitSessionId', async (c) => {
  const user = c.get('user');
  const visitSessionId = parseInt(c.req.param('visitSessionId'));

  // Verify visit session belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, visitSessionId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  const media = await db
    .select()
    .from(mediaAttachments)
    .where(eq(mediaAttachments.visitSessionId, visitSessionId))
    .orderBy(desc(mediaAttachments.uploadedAt));

  return c.json({ media });
});

// GET /api/media/file/:id - Get specific media file
app.get('/file/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  // Get media and verify access
  const [result] = await db
    .select({
      media: mediaAttachments,
      accountId: visitSessions.accountId,
    })
    .from(mediaAttachments)
    .innerJoin(visitSessions, eq(mediaAttachments.visitSessionId, visitSessions.id))
    .where(eq(mediaAttachments.id, id));

  if (!result || result.accountId !== user.accountId) {
    throw new AppError('Media not found', 404);
  }

  // Read and return file
  try {
    const fileBuffer = await fs.readFile(result.media.filePath);

    c.header('Content-Type', result.media.mimeType || 'application/octet-stream');
    c.header('Content-Disposition', `inline; filename="${result.media.fileName}"`);

    return c.body(fileBuffer);
  } catch (error) {
    throw new AppError('File not found on disk', 404);
  }
});

// DELETE /api/media/:id - Delete media file
app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  // Get media and verify access
  const [result] = await db
    .select({
      media: mediaAttachments,
      accountId: visitSessions.accountId,
    })
    .from(mediaAttachments)
    .innerJoin(visitSessions, eq(mediaAttachments.visitSessionId, visitSessions.id))
    .where(eq(mediaAttachments.id, id));

  if (!result || result.accountId !== user.accountId) {
    throw new AppError('Media not found', 404);
  }

  // Delete file from disk
  try {
    await fs.unlink(result.media.filePath);
    if (result.media.thumbnailPath) {
      await fs.unlink(result.media.thumbnailPath);
    }
  } catch (error) {
    // File might not exist, continue with database deletion
  }

  // Delete database entry
  await db.delete(mediaAttachments).where(eq(mediaAttachments.id, id));

  return c.json({ message: 'Media deleted successfully' });
});

// POST /api/media/:id/annotate - Add annotation to photo
app.post('/:id/annotate', validate(annotateSchema), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedData');

  // Get media and verify access
  const [result] = await db
    .select({
      media: mediaAttachments,
      accountId: visitSessions.accountId,
    })
    .from(mediaAttachments)
    .innerJoin(visitSessions, eq(mediaAttachments.visitSessionId, visitSessions.id))
    .where(eq(mediaAttachments.id, id));

  if (!result || result.accountId !== user.accountId) {
    throw new AppError('Media not found', 404);
  }

  // Update caption and metadata
  const [media] = await db
    .update(mediaAttachments)
    .set({
      caption: data.caption || result.media.caption,
      metadata: data.metadata || result.media.metadata,
    })
    .where(eq(mediaAttachments.id, id))
    .returning();

  return c.json({ media });
});

export default app;
