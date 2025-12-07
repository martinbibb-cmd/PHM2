import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { appointments } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';

const app = new Hono();

// Validation schemas
const createAppointmentSchema = z.object({
  customerId: z.number().int().positive(),
  quoteId: z.number().int().positive().optional(),
  appointmentType: z.enum(['survey', 'installation', 'service', 'callback']),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  assignedTo: z.number().int().positive().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const updateAppointmentSchema = createAppointmentSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  cancelledReason: z.string().optional(),
});

const checkInSchema = z.object({
  actualStart: z.string().datetime(),
});

const completeSchema = z.object({
  actualEnd: z.string().datetime(),
  notes: z.string().optional(),
});

// Apply authentication to all routes
app.use('*', authenticate);

// GET /api/appointments - List appointments
app.get('/', async (c) => {
  const user = c.get('user');
  const { start, end, assignedTo, status, customerId } = c.req.query();

  let query = db
    .select()
    .from(appointments)
    .where(eq(appointments.accountId, user.accountId))
    .$dynamic();

  // Filter by date range
  if (start) {
    query = query.where(gte(appointments.scheduledStart, new Date(start)));
  }
  if (end) {
    query = query.where(lte(appointments.scheduledEnd, new Date(end)));
  }

  // Filter by assigned user
  if (assignedTo) {
    query = query.where(eq(appointments.assignedTo, parseInt(assignedTo)));
  }

  // Filter by status
  if (status) {
    query = query.where(eq(appointments.status, status));
  }

  // Filter by customer
  if (customerId) {
    query = query.where(eq(appointments.customerId, parseInt(customerId)));
  }

  const results = await query.orderBy(desc(appointments.scheduledStart));

  return c.json({ appointments: results });
});

// POST /api/appointments - Create appointment
app.post('/', validate(createAppointmentSchema), async (c) => {
  const user = c.get('user');
  const data = c.get('validatedData');

  const [appointment] = await db
    .insert(appointments)
    .values({
      accountId: user.accountId,
      ...data,
      scheduledStart: new Date(data.scheduledStart),
      scheduledEnd: new Date(data.scheduledEnd),
    })
    .returning();

  return c.json({ appointment }, 201);
});

// GET /api/appointments/:id - Get appointment details
app.get('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.accountId, user.accountId)
      )
    );

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  return c.json({ appointment });
});

// PUT /api/appointments/:id - Update appointment
app.put('/:id', validate(updateAppointmentSchema), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedData');

  // Check appointment exists and belongs to account
  const [existing] = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.accountId, user.accountId)
      )
    );

  if (!existing) {
    throw new AppError('Appointment not found', 404);
  }

  const updateData: any = { ...data };
  if (data.scheduledStart) {
    updateData.scheduledStart = new Date(data.scheduledStart);
  }
  if (data.scheduledEnd) {
    updateData.scheduledEnd = new Date(data.scheduledEnd);
  }
  updateData.updatedAt = new Date();

  const [appointment] = await db
    .update(appointments)
    .set(updateData)
    .where(eq(appointments.id, id))
    .returning();

  return c.json({ appointment });
});

// DELETE /api/appointments/:id - Delete appointment
app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  const [existing] = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.accountId, user.accountId)
      )
    );

  if (!existing) {
    throw new AppError('Appointment not found', 404);
  }

  await db.delete(appointments).where(eq(appointments.id, id));

  return c.json({ message: 'Appointment deleted successfully' });
});

// POST /api/appointments/:id/checkin - Mark surveyor arrived
app.post('/:id/checkin', validate(checkInSchema), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedData');

  const [existing] = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.accountId, user.accountId)
      )
    );

  if (!existing) {
    throw new AppError('Appointment not found', 404);
  }

  const [appointment] = await db
    .update(appointments)
    .set({
      status: 'in_progress',
      actualStart: new Date(data.actualStart),
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, id))
    .returning();

  return c.json({ appointment });
});

// POST /api/appointments/:id/complete - Mark appointment done
app.post('/:id/complete', validate(completeSchema), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedData');

  const [existing] = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.accountId, user.accountId)
      )
    );

  if (!existing) {
    throw new AppError('Appointment not found', 404);
  }

  const [appointment] = await db
    .update(appointments)
    .set({
      status: 'completed',
      actualEnd: new Date(data.actualEnd),
      notes: data.notes || existing.notes,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, id))
    .returning();

  return c.json({ appointment });
});

// POST /api/appointments/:id/cancel - Cancel appointment
app.post('/:id/cancel', validate(updateStatusSchema), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedData');

  const [existing] = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.accountId, user.accountId)
      )
    );

  if (!existing) {
    throw new AppError('Appointment not found', 404);
  }

  const [appointment] = await db
    .update(appointments)
    .set({
      status: 'cancelled',
      cancelledReason: data.cancelledReason,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, id))
    .returning();

  return c.json({ appointment });
});

export default app;
