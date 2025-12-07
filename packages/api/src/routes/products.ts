import { Hono } from 'hono';
import { db, products } from '../db/index.js';
import { eq, and, ilike, or, sql, desc } from 'drizzle-orm';
import { authMiddleware, requireAccountAccess } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from '@phm/shared';
import type { CreateProductInput, UpdateProductInput, ProductQueryInput } from '@phm/shared';

const productsRoute = new Hono();

// All routes require authentication
productsRoute.use('*', authMiddleware);

// GET /api/products - List products with pagination and filters
productsRoute.get('/', validateQuery(productQuerySchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const query = c.get('validatedQuery') as ProductQueryInput;

  const { page, pageSize, search, category, manufacturer, isActive } = query;
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [eq(products.accountId, accountId)];

  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.sku, `%${search}%`),
        ilike(products.description, `%${search}%`)
      )!
    );
  }

  if (category) {
    conditions.push(eq(products.category, category));
  }

  if (manufacturer) {
    conditions.push(ilike(products.manufacturer, `%${manufacturer}%`));
  }

  if (isActive !== undefined) {
    conditions.push(eq(products.isActive, isActive));
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(and(...conditions));

  // Get paginated results
  const results = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
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

// GET /api/products/search - Search products by name or SKU (quick search)
productsRoute.get('/search', async (c) => {
  const accountId = requireAccountAccess(c);
  const q = c.req.query('q') || '';
  const limit = parseInt(c.req.query('limit') || '10');

  if (!q || q.length < 2) {
    return c.json({ data: [] });
  }

  const results = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.accountId, accountId),
        eq(products.isActive, true),
        or(
          ilike(products.name, `%${q}%`),
          ilike(products.sku, `%${q}%`)
        )!
      )
    )
    .limit(limit);

  return c.json({ data: results });
});

// POST /api/products - Create product
productsRoute.post('/', validateBody(createProductSchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const data = c.get('validatedBody') as CreateProductInput;

  // Check if SKU already exists for this account
  const existing = await db.query.products.findFirst({
    where: and(
      eq(products.sku, data.sku),
      eq(products.accountId, accountId)
    ),
  });

  if (existing) {
    throw new ConflictError('Product with this SKU already exists');
  }

  const [product] = await db.insert(products).values({
    accountId,
    ...data,
  }).returning();

  return c.json({
    data: product,
    message: 'Product created successfully',
  }, 201);
});

// GET /api/products/:id - Get product by ID
productsRoute.get('/:id', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, id),
      eq(products.accountId, accountId)
    ),
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return c.json({
    data: product,
  });
});

// PUT /api/products/:id - Update product
productsRoute.put('/:id', validateBody(updateProductSchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedBody') as UpdateProductInput;

  // Check if product exists and belongs to account
  const existing = await db.query.products.findFirst({
    where: and(
      eq(products.id, id),
      eq(products.accountId, accountId)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Product not found');
  }

  // If SKU is being changed, check for conflicts
  if (data.sku && data.sku !== existing.sku) {
    const skuConflict = await db.query.products.findFirst({
      where: and(
        eq(products.sku, data.sku),
        eq(products.accountId, accountId)
      ),
    });

    if (skuConflict) {
      throw new ConflictError('Product with this SKU already exists');
    }
  }

  const [updated] = await db.update(products)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();

  return c.json({
    data: updated,
    message: 'Product updated successfully',
  });
});

// DELETE /api/products/:id - Delete product
productsRoute.delete('/:id', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  // Check if product exists and belongs to account
  const existing = await db.query.products.findFirst({
    where: and(
      eq(products.id, id),
      eq(products.accountId, accountId)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Product not found');
  }

  await db.delete(products).where(eq(products.id, id));

  return c.json({
    message: 'Product deleted successfully',
  });
});

export default productsRoute;
