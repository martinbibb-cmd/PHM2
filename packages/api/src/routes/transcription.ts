import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { transcriptions, visitObservations, visitSessions } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { eq, and, desc } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { streamSSE } from 'hono/streaming';

const app = new Hono();

// Validation schemas
const uploadTranscriptionSchema = z.object({
  visitSessionId: z.number().int().positive(),
  moduleId: z.number().int().positive().optional(),
  transcriptText: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
  language: z.string().default('en-GB'),
  durationSeconds: z.number().int().min(0).optional(),
  recordedAt: z.string().datetime(),
  audioUrl: z.string().url().optional(),
});

const extractObservationsSchema = z.object({
  visitSessionId: z.number().int().positive(),
  transcriptText: z.string().min(1),
});

const createObservationSchema = z.object({
  visitSessionId: z.number().int().positive(),
  transcriptionId: z.number().int().positive().optional(),
  observationType: z.string(),
  category: z.enum(['equipment', 'property', 'customer_requirement', 'hazard']),
  key: z.string(),
  value: z.string(),
  confidence: z.enum(['low', 'medium', 'high', 'confirmed']).default('high'),
  context: z.string().optional(),
});

// Apply authentication to all routes
app.use('*', authenticate);

// POST /api/transcription/upload - Upload audio, get transcription
app.post('/upload', validate(uploadTranscriptionSchema), async (c) => {
  const user = c.get('user');
  const data = c.get('validatedData');

  // Verify visit session belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, data.visitSessionId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  const [transcription] = await db
    .insert(transcriptions)
    .values({
      visitSessionId: data.visitSessionId,
      moduleId: data.moduleId,
      transcriptText: data.transcriptText,
      confidence: data.confidence ? data.confidence.toString() : null,
      language: data.language,
      durationSeconds: data.durationSeconds,
      recordedAt: new Date(data.recordedAt),
      audioUrl: data.audioUrl,
    })
    .returning();

  return c.json({ transcription }, 201);
});

// POST /api/transcription/stream - WebSocket/SSE for live transcription
app.get('/stream/:visitSessionId', async (c) => {
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

  return streamSSE(c, async (stream) => {
    // Send initial connection message
    await stream.writeSSE({
      data: JSON.stringify({ type: 'connected', visitSessionId }),
      event: 'connected',
    });

    // In a real implementation, this would:
    // 1. Accept audio chunks from the client
    // 2. Send to Deepgram/Whisper API
    // 3. Stream back transcription results in real-time
    // 4. Store final transcription in database

    // For now, send a sample message
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'transcription',
        text: 'Live transcription will appear here...',
        isFinal: false,
      }),
      event: 'transcription',
    });

    // Keep connection alive
    let keepAliveInterval = setInterval(async () => {
      await stream.writeSSE({
        data: JSON.stringify({ type: 'ping' }),
        event: 'ping',
      });
    }, 30000);

    // Cleanup on disconnect
    stream.onAbort(() => {
      clearInterval(keepAliveInterval);
    });
  });
});

// POST /api/transcription/extract-observations - AI extract structured data
app.post('/extract-observations', validate(extractObservationsSchema), async (c) => {
  const user = c.get('user');
  const data = c.get('validatedData');

  // Verify visit session belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, data.visitSessionId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  // In a real implementation, this would:
  // 1. Send transcript to AI (Gemini/GPT)
  // 2. Extract structured observations
  // 3. Store in visit_observations table
  // 4. Return extracted data

  // Sample extracted observations
  const sampleObservations = [
    {
      observationType: 'boiler_make',
      category: 'equipment' as const,
      key: 'existing_boiler_manufacturer',
      value: 'Worcester Bosch',
      confidence: 'high' as const,
      context: 'Customer mentioned Worcester Bosch boiler',
    },
    {
      observationType: 'boiler_age',
      category: 'equipment' as const,
      key: 'existing_boiler_age',
      value: '15 years',
      confidence: 'high' as const,
      context: 'Boiler installed 15 years ago',
    },
  ];

  // Store observations
  const observations = await Promise.all(
    sampleObservations.map((obs) =>
      db
        .insert(visitObservations)
        .values({
          visitSessionId: data.visitSessionId,
          ...obs,
        })
        .returning()
    )
  );

  return c.json({
    message: 'Observations extracted successfully',
    count: observations.length,
    observations: observations.map(([obs]) => obs),
  });
});

// POST /api/transcription/observations - Create observation manually
app.post('/observations', validate(createObservationSchema), async (c) => {
  const user = c.get('user');
  const data = c.get('validatedData');

  // Verify visit session belongs to account
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.id, data.visitSessionId),
        eq(visitSessions.accountId, user.accountId)
      )
    );

  if (!visit) {
    throw new AppError('Visit session not found', 404);
  }

  const [observation] = await db
    .insert(visitObservations)
    .values(data)
    .returning();

  return c.json({ observation }, 201);
});

// GET /api/transcription/observations/:visitSessionId - Get observations for visit
app.get('/observations/:visitSessionId', async (c) => {
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

  const observations = await db
    .select()
    .from(visitObservations)
    .where(eq(visitObservations.visitSessionId, visitSessionId))
    .orderBy(desc(visitObservations.createdAt));

  return c.json({ observations });
});

// PUT /api/transcription/observations/:id - Update observation
app.put('/observations/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();

  // Get observation and verify access
  const [existing] = await db
    .select({
      observation: visitObservations,
      accountId: visitSessions.accountId,
    })
    .from(visitObservations)
    .innerJoin(visitSessions, eq(visitObservations.visitSessionId, visitSessions.id))
    .where(eq(visitObservations.id, id));

  if (!existing || existing.accountId !== user.accountId) {
    throw new AppError('Observation not found', 404);
  }

  const [observation] = await db
    .update(visitObservations)
    .set({
      value: body.value,
      confidence: body.confidence,
      context: body.context,
    })
    .where(eq(visitObservations.id, id))
    .returning();

  return c.json({ observation });
});

// DELETE /api/transcription/observations/:id - Delete observation
app.delete('/observations/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  // Get observation and verify access
  const [existing] = await db
    .select({
      observation: visitObservations,
      accountId: visitSessions.accountId,
    })
    .from(visitObservations)
    .innerJoin(visitSessions, eq(visitObservations.visitSessionId, visitSessions.id))
    .where(eq(visitObservations.id, id));

  if (!existing || existing.accountId !== user.accountId) {
    throw new AppError('Observation not found', 404);
  }

  await db.delete(visitObservations).where(eq(visitObservations.id, id));

  return c.json({ message: 'Observation deleted successfully' });
});

export default app;
