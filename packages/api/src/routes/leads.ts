import { Hono } from 'hono';
import { db, leads, customers } from '../db/index.js';
import { eq, and, ilike, or, sql, desc } from 'drizzle-orm';
import { authMiddleware, requireAccountAccess } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { NotFoundError } from '../utils/errors.js';
import { createLeadSchema, updateLeadSchema, leadQuerySchema } from '@phm/shared';
import type { CreateLeadInput, UpdateLeadInput, LeadQueryInput } from '@phm/shared';

const leadsRoute = new Hono();

// All routes require authentication
leadsRoute.use('*', authMiddleware);

// GET /api/leads - List leads with pagination and filters
leadsRoute.get('/', validateQuery(leadQuerySchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const query = c.get('validatedQuery') as LeadQueryInput;

  const { page, pageSize, search, status, priority, assignedTo } = query;
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [eq(leads.accountId, accountId)];

  if (search) {
    // Search in lead notes and customer name
    conditions.push(
      or(
        ilike(leads.notes, `%${search}%`),
        ilike(leads.source, `%${search}%`),
        ilike(leads.campaign, `%${search}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(leads.status, status));
  }

  if (priority) {
    conditions.push(eq(leads.priority, priority));
  }

  if (assignedTo) {
    conditions.push(eq(leads.assignedTo, assignedTo));
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(and(...conditions));

  // Get paginated results with customer info
  const results = await db.query.leads.findMany({
    where: and(...conditions),
    with: {
      customer: true,
      assignedUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [desc(leads.createdAt)],
    limit: pageSize,
    offset,
  });

  return c.json({
    data: results,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize),
    },
  });
});

// POST /api/leads - Create lead
leadsRoute.post('/', validateBody(createLeadSchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const userId = c.get('user').userId;
  const data = c.get('validatedBody') as CreateLeadInput;

  // Verify customer belongs to account
  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, data.customerId),
      eq(customers.accountId, accountId)
    ),
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  const [lead] = await db.insert(leads).values({
    accountId,
    ...data,
    assignedTo: data.assignedTo || userId, // Auto-assign to creator if not specified
  }).returning();

  // Fetch with relations
  const leadWithRelations = await db.query.leads.findFirst({
    where: eq(leads.id, lead.id),
    with: {
      customer: true,
      assignedUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return c.json({
    data: leadWithRelations,
    message: 'Lead created successfully',
  }, 201);
});

// GET /api/leads/:id - Get lead by ID
leadsRoute.get('/:id', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  const lead = await db.query.leads.findFirst({
    where: and(
      eq(leads.id, id),
      eq(leads.accountId, accountId)
    ),
    with: {
      customer: true,
      assignedUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!lead) {
    throw new NotFoundError('Lead not found');
  }

  return c.json({
    data: lead,
  });
});

// PUT /api/leads/:id - Update lead
leadsRoute.put('/:id', validateBody(updateLeadSchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedBody') as UpdateLeadInput;

  // Check if lead exists and belongs to account
  const existing = await db.query.leads.findFirst({
    where: and(
      eq(leads.id, id),
      eq(leads.accountId, accountId)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Lead not found');
  }

  const [updated] = await db.update(leads)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
    .returning();

  // Fetch with relations
  const leadWithRelations = await db.query.leads.findFirst({
    where: eq(leads.id, updated.id),
    with: {
      customer: true,
      assignedUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return c.json({
    data: leadWithRelations,
    message: 'Lead updated successfully',
  });
});

// DELETE /api/leads/:id - Delete lead
leadsRoute.delete('/:id', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  // Check if lead exists and belongs to account
  const existing = await db.query.leads.findFirst({
    where: and(
      eq(leads.id, id),
      eq(leads.accountId, accountId)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Lead not found');
  }

  await db.delete(leads).where(eq(leads.id, id));

  return c.json({
    message: 'Lead deleted successfully',
  });
});

export default leadsRoute;
