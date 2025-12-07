import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { visitSessions, surveyModules, transcriptions, visitObservations, mediaAttachments } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { eq, and, desc } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';

const app = new Hono();

// Validation schemas
const createVisitSchema = z.object({
  customerId: z.number().int().positive(),
  appointmentId: z.number().int().positive().optional(),
  surveyType: z.enum(['boiler', 'heat_pump', 'solar_pv', 'ev_charger', 'full_home']),
  weatherConditions: z.string().optional(),
  notes: z.string().optional(),
});

const updateVisitSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
  weatherConditions: z.string().optional(),
  notes: z.string().optional(),
});

const completeVisitSchema = z.object({
  notes: z.string().optional(),
});

const createModuleSchema = z.object({
  moduleType: z.enum([
    'property',
    'central_heating',
    'heat_pump',
    'solar_pv',
    'ev_charger',
    'hazards',
    'insulation',
    'glazing',
  ]),
  data: z.record(z.any()).optional(),
});

const updateModuleSchema = z.object({
  status: z.enum(['in_progress', 'completed']).optional(),
  data: z.record(z.any()).optional(),
});

// Apply authentication to all routes
app.use('*', authenticate);

// GET /api/visits - List visit sessions
app.get('/', async (c) => {
  const user = c.get('user');
  const { customerId, surveyorId, status } = c.req.query();

  let query = db
    .select()
    .from(visitSessions)
    .where(eq(visitSessions.accountId, user.accountId))
    .$dynamic();

  if (customerId) {
    query = query.where(eq(visitSessions.customerId, parseInt(customerId)));
  }

  if (surveyorId) {
    query = query.where(eq(visitSessions.surveyorId, parseInt(surveyorId)));
  }

  if (status) {
    query = query.where(eq(visitSessions.status, status));
  }

  const results = await query.orderBy(desc(visitSessions.startedAt));

  return c.json({ visits: results });
});

// POST /api/visits - Start new survey session
app.post('/', validate(createVisitSchema), async (c) => {
  const user = c.get('user');
  const data = c.get('validatedData');

  const [visit] = await db
    .insert(visitSessions)
    .values({
      accountId: user.accountId,
      surveyorId: user.id,
      ...data,
    })
    .returning();

  return c.json({ visit }, 201);
});

// GET /api/visits/:id - Get session with all modules
app.get('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, id),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  // Get all modules for this visit
  const modules = await db
    .select()
    .from(surveyModules)
    .where(eq(surveyModules.visitSessionId, id))
    .orderBy(surveyModules.startedAt);

  // Get transcriptions
  const transcriptionRecords = await db
    .select()
    .from(transcriptions)
    .where(eq(transcriptions.visitSessionId, id))
    .orderBy(transcriptions.recordedAt);

  // Get observations
  const observations = await db
    .select()
    .from(visitObservations)
    .where(eq(visitObservations.visitSessionId, id))
    .orderBy(desc(visitObservations.createdAt));

  // Get media
  const media = await db
    .select()
    .from(mediaAttachments)
    .where(eq(mediaAttachments.visitSessionId, id))
    .orderBy(desc(mediaAttachments.uploadedAt));

  return c.json({
    visit,
    modules,
    transcriptions: transcriptionRecords,
    observations,
    media,
  });
});

// PUT /api/visits/:id - Update session
app.put('/:id', validate(updateVisitSchema), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedData');

  const [existing] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, id),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!existing) {
    throw new AppError('Visit session not found', 404);
  }

  const [visit] = await db
    .update(visitSessions)
    .set(data)
    .where(eq(visitSessions.id, id))
    .returning();

  return c.json({ visit });
});

// DELETE /api/visits/:id - Delete session
app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  const [existing] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, id),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!existing) {
    throw new AppError('Visit session not found', 404);
  }

  await db.delete(visitSessions).where(eq(visitSessions.id, id));

  return c.json({ message: 'Visit session deleted successfully' });
});

// POST /api/visits/:id/complete - Mark survey complete
app.post('/:id/complete', validate(completeVisitSchema), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedData');

  const [existing] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, id),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!existing) {
    throw new AppError('Visit session not found', 404);
  }

  const [visit] = await db
    .update(visitSessions)
    .set({
      status: 'completed',
      completedAt: new Date(),
      notes: data.notes || existing.notes,
    })
    .where(eq(visitSessions.id, id))
    .returning();

  return c.json({ visit });
});

// GET /api/visits/:id/modules - List modules in session
app.get('/:id/modules', async (c) => {
  const user = c.get('user');
  const visitId = parseInt(c.req.param('id'));

  // Verify visit belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, visitId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  const modules = await db
    .select()
    .from(surveyModules)
    .where(eq(surveyModules.visitSessionId, visitId))
    .orderBy(surveyModules.startedAt);

  return c.json({ modules });
});

// POST /api/visits/:id/modules - Add new module
app.post('/:id/modules', validate(createModuleSchema), async (c) => {
  const user = c.get('user');
  const visitId = parseInt(c.req.param('id'));
  const data = c.get('validatedData');

  // Verify visit belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, visitId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  const [module] = await db
    .insert(surveyModules)
    .values({
      visitSessionId: visitId,
      ...data,
    })
    .returning();

  return c.json({ module }, 201);
});

// GET /api/visits/:id/modules/:moduleId - Get module data
app.get('/:id/modules/:moduleId', async (c) => {
  const user = c.get('user');
  const visitId = parseInt(c.req.param('id'));
  const moduleId = parseInt(c.req.param('moduleId'));

  // Verify visit belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, visitId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  const [module] = await db
    .select()
    .from(surveyModules)
    .where(
      and(
        eq(surveyModules.id, moduleId),
        eq(surveyModules.visitSessionId, visitId)
      )
    );

  if (!module) {
    throw new AppError('Module not found', 404);
  }

  // Get transcriptions for this module
  const moduleTranscriptions = await db
    .select()
    .from(transcriptions)
    .where(eq(transcriptions.moduleId, moduleId))
    .orderBy(transcriptions.recordedAt);

  // Get media for this module
  const moduleMedia = await db
    .select()
    .from(mediaAttachments)
    .where(eq(mediaAttachments.moduleId, moduleId))
    .orderBy(desc(mediaAttachments.uploadedAt));

  return c.json({
    module,
    transcriptions: moduleTranscriptions,
    media: moduleMedia,
  });
});

// PUT /api/visits/:id/modules/:moduleId - Update module data
app.put('/:id/modules/:moduleId', validate(updateModuleSchema), async (c) => {
  const user = c.get('user');
  const visitId = parseInt(c.req.param('id'));
  const moduleId = parseInt(c.req.param('moduleId'));
  const data = c.get('validatedData');

  // Verify visit belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, visitId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  const [module] = await db
    .update(surveyModules)
    .set(data)
    .where(
      and(
        eq(surveyModules.id, moduleId),
        eq(surveyModules.visitSessionId, visitId)
      )
    )
    .returning();

  if (!module) {
    throw new AppError('Module not found', 404);
  }

  return c.json({ module });
});

// DELETE /api/visits/:id/modules/:moduleId - Delete module
app.delete('/:id/modules/:moduleId', async (c) => {
  const user = c.get('user');
  const visitId = parseInt(c.req.param('id'));
  const moduleId = parseInt(c.req.param('moduleId'));

  // Verify visit belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, visitId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  await db
    .delete(surveyModules)
    .where(
      and(
        eq(surveyModules.id, moduleId),
        eq(surveyModules.visitSessionId, visitId)
      )
    );

  return c.json({ message: 'Module deleted successfully' });
});

// POST /api/visits/:id/modules/:moduleId/complete - Mark module done
app.post('/:id/modules/:moduleId/complete', async (c) => {
  const user = c.get('user');
  const visitId = parseInt(c.req.param('id'));
  const moduleId = parseInt(c.req.param('moduleId'));

  // Verify visit belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, visitId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  const [module] = await db
    .update(surveyModules)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(
      and(
        eq(surveyModules.id, moduleId),
        eq(surveyModules.visitSessionId, visitId)
      )
    )
    .returning();

  if (!module) {
    throw new AppError('Module not found', 404);
  }

  return c.json({ module });
});

// GET /api/visits/:id/transcriptions - Get all transcriptions for session
app.get('/:id/transcriptions', async (c) => {
  const user = c.get('user');
  const visitId = parseInt(c.req.param('id'));

  // Verify visit belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, visitId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  const transcriptionRecords = await db
    .select()
    .from(transcriptions)
    .where(eq(transcriptions.visitSessionId, visitId))
    .orderBy(transcriptions.recordedAt);

  return c.json({ transcriptions: transcriptionRecords });
});

export default app;
