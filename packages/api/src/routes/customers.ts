import { Hono } from 'hono';
import { db, customers } from '../db/index.js';
import { eq, and, ilike, or, sql, desc } from 'drizzle-orm';
import { authMiddleware, requireAccountAccess } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { NotFoundError } from '../utils/errors.js';
import { createCustomerSchema, updateCustomerSchema, customerQuerySchema } from '@phm/shared';
import type { CreateCustomerInput, UpdateCustomerInput, CustomerQueryInput } from '@phm/shared';

const customersRoute = new Hono();

// All routes require authentication
customersRoute.use('*', authMiddleware);

// GET /api/customers - List customers with pagination and filters
customersRoute.get('/', validateQuery(customerQuerySchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const query = c.get('validatedQuery') as CustomerQueryInput;

  const { page, pageSize, search, propertyType, tags } = query;
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [eq(customers.accountId, accountId)];

  if (search) {
    conditions.push(
      or(
        ilike(customers.firstName, `%${search}%`),
        ilike(customers.lastName, `%${search}%`),
        ilike(customers.email, `%${search}%`),
        ilike(customers.postcode, `%${search}%`)
      )!
    );
  }

  if (propertyType) {
    conditions.push(eq(customers.propertyType, propertyType));
  }

  if (tags) {
    const tagArray = tags.split(',').map(t => t.trim());
    conditions.push(
      sql`${customers.tags} ?| array[${sql.join(tagArray.map(t => sql`${t}`), sql`, `)}]`
    );
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers)
    .where(and(...conditions));

  // Get paginated results
  const results = await db
    .select()
    .from(customers)
    .where(and(...conditions))
    .orderBy(desc(customers.createdAt))
    .limit(pageSize)
    .offset(offset);

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

// POST /api/customers - Create customer
customersRoute.post('/', validateBody(createCustomerSchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const data = c.get('validatedBody') as CreateCustomerInput;

  const [customer] = await db.insert(customers).values({
    accountId,
    ...data,
  }).returning();

  return c.json({
    data: customer,
    message: 'Customer created successfully',
  }, 201);
});

// GET /api/customers/:id - Get customer by ID
customersRoute.get('/:id', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.accountId, accountId)
    ),
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  return c.json({
    data: customer,
  });
});

// PUT /api/customers/:id - Update customer
customersRoute.put('/:id', validateBody(updateCustomerSchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedBody') as UpdateCustomerInput;

  // Check if customer exists and belongs to account
  const existing = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.accountId, accountId)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Customer not found');
  }

  const [updated] = await db.update(customers)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id))
    .returning();

  return c.json({
    data: updated,
    message: 'Customer updated successfully',
  });
});

// DELETE /api/customers/:id - Delete customer
customersRoute.delete('/:id', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  // Check if customer exists and belongs to account
  const existing = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.accountId, accountId)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Customer not found');
  }

  await db.delete(customers).where(eq(customers.id, id));

  return c.json({
    message: 'Customer deleted successfully',
  });
});

// GET /api/customers/:id/quotes - Get customer's quotes
customersRoute.get('/:id/quotes', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  // Check if customer exists and belongs to account
  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.accountId, accountId)
    ),
    with: {
      quotes: {
        orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
      },
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  return c.json({
    data: customer.quotes || [],
  });
});

// GET /api/customers/:id/visits - Get customer's visit sessions
customersRoute.get('/:id/visits', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  // Check if customer exists and belongs to account
  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.accountId, accountId)
    ),
    with: {
      visitSessions: {
        orderBy: (visitSessions, { desc }) => [desc(visitSessions.startedAt)],
      },
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  return c.json({
    data: customer.visitSessions || [],
  });
});

export default customersRoute;
