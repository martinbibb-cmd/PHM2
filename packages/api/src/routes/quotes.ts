import { Hono } from 'hono';
import { db, quotes, quoteLines, customers } from '../db/index.js';
import { eq, and, ilike, or, sql, desc } from 'drizzle-orm';
import { authMiddleware, requireAccountAccess } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { NotFoundError } from '../utils/errors.js';
import { createQuoteSchema, updateQuoteSchema, quoteQuerySchema } from '@phm/shared';
import type { CreateQuoteInput, UpdateQuoteInput, QuoteQueryInput } from '@phm/shared';

const quotesRoute = new Hono();

// All routes require authentication
quotesRoute.use('*', authMiddleware);

// Helper function to calculate quote totals
function calculateQuoteTotals(lines: Array<{ quantity: number; unitPrice: number; discount: number }>, taxRate: number) {
  const subtotal = lines.reduce((sum, line) => {
    const lineTotal = (line.quantity * line.unitPrice) - line.discount;
    return sum + lineTotal;
  }, 0);

  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return { subtotal, taxAmount, total };
}

// Helper function to generate quote number
async function generateQuoteNumber(accountId: number): Promise<string> {
  const year = new Date().getFullYear();

  // Get the latest quote number for this year
  const latestQuote = await db.query.quotes.findFirst({
    where: and(
      eq(quotes.accountId, accountId),
      ilike(quotes.quoteNumber, `QUO-${year}-%`)
    ),
    orderBy: [desc(quotes.createdAt)],
  });

  let nextNumber = 1;
  if (latestQuote && latestQuote.quoteNumber) {
    const match = latestQuote.quoteNumber.match(/QUO-\d+-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `QUO-${year}-${nextNumber.toString().padStart(3, '0')}`;
}

// GET /api/quotes - List quotes with pagination and filters
quotesRoute.get('/', validateQuery(quoteQuerySchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const query = c.get('validatedQuery') as QuoteQueryInput;

  const { page, pageSize, search, status, customerId } = query;
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [eq(quotes.accountId, accountId)];

  if (search) {
    conditions.push(
      or(
        ilike(quotes.quoteNumber, `%${search}%`),
        ilike(quotes.title, `%${search}%`),
        ilike(quotes.notes, `%${search}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(quotes.status, status));
  }

  if (customerId) {
    conditions.push(eq(quotes.customerId, customerId));
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quotes)
    .where(and(...conditions));

  // Get paginated results with customer info
  const results = await db.query.quotes.findMany({
    where: and(...conditions),
    with: {
      customer: true,
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [desc(quotes.createdAt)],
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

// POST /api/quotes - Create quote
quotesRoute.post('/', validateBody(createQuoteSchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const userId = c.get('user').userId;
  const data = c.get('validatedBody') as CreateQuoteInput;

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

  // Calculate totals
  const { subtotal, taxAmount, total } = calculateQuoteTotals(data.lines, data.taxRate || 20);

  // Generate quote number
  const quoteNumber = await generateQuoteNumber(accountId);

  // Create quote and lines in transaction
  const result = await db.transaction(async (tx) => {
    // Create quote
    const [quote] = await tx.insert(quotes).values({
      accountId,
      customerId: data.customerId,
      leadId: data.leadId,
      quoteNumber,
      title: data.title,
      validUntil: data.validUntil,
      taxRate: data.taxRate || 20,
      subtotal,
      taxAmount,
      total,
      depositAmount: data.depositAmount,
      notes: data.notes,
      termsAndConditions: data.termsAndConditions,
      createdBy: userId,
    }).returning();

    // Create quote lines
    const lines = await Promise.all(
      data.lines.map((line, index) =>
        tx.insert(quoteLines).values({
          quoteId: quote.id,
          productId: line.productId,
          sortOrder: index,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discount: line.discount || 0,
          lineTotal: (line.quantity * line.unitPrice) - (line.discount || 0),
          notes: line.notes,
        }).returning()
      )
    );

    return { quote, lines: lines.flat() };
  });

  // Fetch with all relations
  const quoteWithRelations = await db.query.quotes.findFirst({
    where: eq(quotes.id, result.quote.id),
    with: {
      customer: true,
      lines: {
        with: {
          product: true,
        },
      },
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return c.json({
    data: quoteWithRelations,
    message: 'Quote created successfully',
  }, 201);
});

// GET /api/quotes/:id - Get quote by ID with lines
quotesRoute.get('/:id', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  const quote = await db.query.quotes.findFirst({
    where: and(
      eq(quotes.id, id),
      eq(quotes.accountId, accountId)
    ),
    with: {
      customer: true,
      lead: true,
      lines: {
        with: {
          product: true,
        },
        orderBy: (quoteLines, { asc }) => [asc(quoteLines.sortOrder)],
      },
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  return c.json({
    data: quote,
  });
});

// PUT /api/quotes/:id - Update quote
quotesRoute.put('/:id', validateBody(updateQuoteSchema), async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));
  const data = c.get('validatedBody') as UpdateQuoteInput;

  // Check if quote exists and belongs to account
  const existing = await db.query.quotes.findFirst({
    where: and(
      eq(quotes.id, id),
      eq(quotes.accountId, accountId)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Quote not found');
  }

  // Update quote and lines in transaction
  const result = await db.transaction(async (tx) => {
    let updateData: any = {
      title: data.title,
      validUntil: data.validUntil,
      taxRate: data.taxRate,
      depositAmount: data.depositAmount,
      notes: data.notes,
      termsAndConditions: data.termsAndConditions,
      status: data.status,
      updatedAt: new Date(),
    };

    // If lines are provided, recalculate totals and update lines
    if (data.lines) {
      const { subtotal, taxAmount, total } = calculateQuoteTotals(data.lines, data.taxRate || existing.taxRate);
      updateData = {
        ...updateData,
        subtotal,
        taxAmount,
        total,
      };

      // Delete existing lines
      await tx.delete(quoteLines).where(eq(quoteLines.quoteId, id));

      // Create new lines
      await Promise.all(
        data.lines.map((line, index) =>
          tx.insert(quoteLines).values({
            quoteId: id,
            productId: line.productId,
            sortOrder: index,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount || 0,
            lineTotal: (line.quantity * line.unitPrice) - (line.discount || 0),
            notes: line.notes,
          })
        )
      );
    }

    // Update quote
    const [updated] = await tx.update(quotes)
      .set(updateData)
      .where(eq(quotes.id, id))
      .returning();

    return updated;
  });

  // Fetch with all relations
  const quoteWithRelations = await db.query.quotes.findFirst({
    where: eq(quotes.id, id),
    with: {
      customer: true,
      lines: {
        with: {
          product: true,
        },
        orderBy: (quoteLines, { asc }) => [asc(quoteLines.sortOrder)],
      },
      createdByUser: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return c.json({
    data: quoteWithRelations,
    message: 'Quote updated successfully',
  });
});

// DELETE /api/quotes/:id - Delete quote
quotesRoute.delete('/:id', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  // Check if quote exists and belongs to account
  const existing = await db.query.quotes.findFirst({
    where: and(
      eq(quotes.id, id),
      eq(quotes.accountId, accountId)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Quote not found');
  }

  // Delete quote (lines will be cascade deleted)
  await db.delete(quotes).where(eq(quotes.id, id));

  return c.json({
    message: 'Quote deleted successfully',
  });
});

// POST /api/quotes/:id/send - Send quote to customer
quotesRoute.post('/:id/send', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  const existing = await db.query.quotes.findFirst({
    where: and(
      eq(quotes.id, id),
      eq(quotes.accountId, accountId)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Quote not found');
  }

  const [updated] = await db.update(quotes)
    .set({
      status: 'sent',
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, id))
    .returning();

  // TODO: Send email to customer

  return c.json({
    data: updated,
    message: 'Quote sent successfully',
  });
});

// POST /api/quotes/:id/accept - Customer accepts quote
quotesRoute.post('/:id/accept', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  const existing = await db.query.quotes.findFirst({
    where: and(
      eq(quotes.id, id),
      eq(quotes.accountId, accountId)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Quote not found');
  }

  const [updated] = await db.update(quotes)
    .set({
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, id))
    .returning();

  return c.json({
    data: updated,
    message: 'Quote accepted',
  });
});

// POST /api/quotes/:id/reject - Customer rejects quote
quotesRoute.post('/:id/reject', async (c) => {
  const accountId = requireAccountAccess(c);
  const id = parseInt(c.req.param('id'));

  const existing = await db.query.quotes.findFirst({
    where: and(
      eq(quotes.id, id),
      eq(quotes.accountId, accountId)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Quote not found');
  }

  const [updated] = await db.update(quotes)
    .set({
      status: 'rejected',
      rejectedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, id))
    .returning();

  return c.json({
    data: updated,
    message: 'Quote rejected',
  });
});

// POST /api/quotes/:id/duplicate - Clone existing quote
quotesRoute.post('/:id/duplicate', async (c) => {
  const accountId = requireAccountAccess(c);
  const userId = c.get('user').userId;
  const id = parseInt(c.req.param('id'));

  // Get original quote with lines
  const original = await db.query.quotes.findFirst({
    where: and(
      eq(quotes.id, id),
      eq(quotes.accountId, accountId)
    ),
    with: {
      lines: true,
    },
  });

  if (!original) {
    throw new NotFoundError('Quote not found');
  }

  // Generate new quote number
  const quoteNumber = await generateQuoteNumber(accountId);

  // Create duplicate in transaction
  const result = await db.transaction(async (tx) => {
    // Create new quote
    const [newQuote] = await tx.insert(quotes).values({
      accountId,
      customerId: original.customerId,
      leadId: original.leadId,
      quoteNumber,
      title: `${original.title} (Copy)`,
      status: 'draft',
      validUntil: original.validUntil,
      taxRate: original.taxRate,
      subtotal: original.subtotal,
      taxAmount: original.taxAmount,
      total: original.total,
      depositAmount: original.depositAmount,
      notes: original.notes,
      termsAndConditions: original.termsAndConditions,
      createdBy: userId,
    }).returning();

    // Copy lines
    const lines = await Promise.all(
      original.lines.map((line) =>
        tx.insert(quoteLines).values({
          quoteId: newQuote.id,
          productId: line.productId,
          sortOrder: line.sortOrder,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discount: line.discount,
          lineTotal: line.lineTotal,
          notes: line.notes,
        }).returning()
      )
    );

    return { quote: newQuote, lines: lines.flat() };
  });

  // Fetch with relations
  const quoteWithRelations = await db.query.quotes.findFirst({
    where: eq(quotes.id, result.quote.id),
    with: {
      customer: true,
      lines: {
        with: {
          product: true,
        },
      },
    },
  });

  return c.json({
    data: quoteWithRelations,
    message: 'Quote duplicated successfully',
  }, 201);
});

export default quotesRoute;
