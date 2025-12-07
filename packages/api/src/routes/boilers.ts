import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { boilerSpecifications } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { eq, like, or, and, desc, sql } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';

const app = new Hono();

// Validation schemas
const searchSchema = z.object({
  query: z.string().optional(),
  manufacturer: z.string().optional(),
  fuelType: z.enum(['gas', 'oil', 'electric', 'lpg']).optional(),
  boilerType: z.enum(['combi', 'system', 'regular']).optional(),
  minOutputKw: z.coerce.number().optional(),
  maxOutputKw: z.coerce.number().optional(),
  isActive: z.coerce.boolean().default(true),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const createBoilerSchema = z.object({
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  fuelType: z.enum(['gas', 'oil', 'electric', 'lpg']).optional(),
  boilerType: z.enum(['combi', 'system', 'regular']).optional(),
  outputKw: z.number().positive().optional(),
  flowRateLpm: z.number().positive().optional(),
  dimensions: z.object({
    height: z.number(),
    width: z.number(),
    depth: z.number(),
  }).optional(),
  weight: z.number().optional(),
  efficiency: z.number().min(0).max(100).optional(),
  erpRating: z.string().optional(),
  flueType: z.string().optional(),
  minGasPressure: z.number().optional(),
  maxGasPressure: z.number().optional(),
  warranty: z.number().int().optional(),
  installDate: z.string().optional(),
  discontinuedDate: z.string().optional(),
  replacementModel: z.string().optional(),
  datasheetUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
});

// Apply authentication to all routes
app.use('*', authenticate);

// GET /api/boilers/search - Search boiler specs
app.get('/search', async (c) => {
  const params = c.req.query();
  const validated = searchSchema.parse(params);

  const { query, manufacturer, fuelType, boilerType, minOutputKw, maxOutputKw, isActive, page, pageSize } = validated;

  let dbQuery = db.select().from(boilerSpecifications).$dynamic();

  // Text search
  if (query) {
    dbQuery = dbQuery.where(
      or(
        like(boilerSpecifications.manufacturer, `%${query}%`),
        like(boilerSpecifications.model, `%${query}%`)
      )
    );
  }

  // Filters
  if (manufacturer) {
    dbQuery = dbQuery.where(eq(boilerSpecifications.manufacturer, manufacturer));
  }

  if (fuelType) {
    dbQuery = dbQuery.where(eq(boilerSpecifications.fuelType, fuelType));
  }

  if (boilerType) {
    dbQuery = dbQuery.where(eq(boilerSpecifications.boilerType, boilerType));
  }

  if (minOutputKw) {
    dbQuery = dbQuery.where(sql`${boilerSpecifications.outputKw} >= ${minOutputKw}`);
  }

  if (maxOutputKw) {
    dbQuery = dbQuery.where(sql`${boilerSpecifications.outputKw} <= ${maxOutputKw}`);
  }

  dbQuery = dbQuery.where(eq(boilerSpecifications.isActive, isActive));

  // Count total
  const countQuery = db.select({ count: sql<number>`count(*)` }).from(boilerSpecifications);
  const [{ count }] = await countQuery;

  // Pagination
  const offset = (page - 1) * pageSize;
  const results = await dbQuery
    .orderBy(boilerSpecifications.manufacturer, boilerSpecifications.model)
    .limit(pageSize)
    .offset(offset);

  return c.json({
    boilers: results,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize),
    },
  });
});

// GET /api/boilers/manufacturers - List manufacturers
app.get('/manufacturers', async (c) => {
  const results = await db
    .selectDistinct({ manufacturer: boilerSpecifications.manufacturer })
    .from(boilerSpecifications)
    .where(eq(boilerSpecifications.isActive, true))
    .orderBy(boilerSpecifications.manufacturer);

  return c.json({
    manufacturers: results.map((r) => r.manufacturer),
  });
});

// GET /api/boilers/:id - Get boiler spec sheet
app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  const [boiler] = await db
    .select()
    .from(boilerSpecifications)
    .where(eq(boilerSpecifications.id, id));

  if (!boiler) {
    throw new AppError('Boiler specification not found', 404);
  }

  return c.json({ boiler });
});

// POST /api/boilers - Create boiler specification (admin only)
app.post('/', validate(createBoilerSchema), async (c) => {
  const user = c.get('user');
  const data = c.get('validatedData');

  // Check if user is admin
  if (user.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const [boiler] = await db
    .insert(boilerSpecifications)
    .values(data)
    .returning();

  return c.json({ boiler }, 201);
});

// PUT /api/boilers/:id - Update boiler specification (admin only)
app.put('/:id', validate(createBoilerSchema.partial()), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedData');

  // Check if user is admin
  if (user.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const [boiler] = await db
    .update(boilerSpecifications)
    .set(data)
    .where(eq(boilerSpecifications.id, id))
    .returning();

  if (!boiler) {
    throw new AppError('Boiler specification not found', 404);
  }

  return c.json({ boiler });
});

// DELETE /api/boilers/:id - Soft delete boiler specification (admin only)
app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  // Check if user is admin
  if (user.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const [boiler] = await db
    .update(boilerSpecifications)
    .set({ isActive: false })
    .where(eq(boilerSpecifications.id, id))
    .returning();

  if (!boiler) {
    throw new AppError('Boiler specification not found', 404);
  }

  return c.json({ message: 'Boiler specification deactivated successfully' });
});

// POST /api/boilers/identify - Identify boiler from photo (future feature)
app.post('/identify', async (c) => {
  // This would integrate with AI vision API to identify boiler from photo
  // For now, return placeholder
  return c.json({
    message: 'Boiler identification from photos coming soon',
    suggestions: [],
  });
});

// GET /api/boilers/:id/compatible - Get compatible accessories
app.get('/:id/compatible', async (c) => {
  const id = parseInt(c.req.param('id'));

  const [boiler] = await db
    .select()
    .from(boilerSpecifications)
    .where(eq(boilerSpecifications.id, id));

  if (!boiler) {
    throw new AppError('Boiler specification not found', 404);
  }

  // In a real implementation, this would return compatible cylinders, controls, etc.
  return c.json({
    boiler,
    compatible: {
      cylinders: [],
      controls: [],
      filters: [],
    },
  });
});

export default app;
