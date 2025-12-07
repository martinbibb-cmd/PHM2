import { Hono } from 'hono';
import { db } from '../db/index.js';
import { visitSessions, surveyModules, visitObservations, mediaAttachments, customers } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';

const app = new Hono();

// GET /api/public/view/:shareId - Public view of visit data (no auth required)
app.get('/view/:shareId', async (c) => {
  const shareId = c.req.param('shareId');

  // Find visit by shareId
  const [visit] = await db
    .select()
    .from(visitSessions)
    .where(eq(visitSessions.shareId, shareId));

  if (!visit) {
    throw new AppError('Visit not found or link has expired', 404);
  }

  // Get customer information
  const [customer] = await db
    .select({
      firstName: customers.firstName,
      lastName: customers.lastName,
      addressLine1: customers.addressLine1,
      addressLine2: customers.addressLine2,
      city: customers.city,
      postcode: customers.postcode,
      propertyType: customers.propertyType,
      constructionYear: customers.constructionYear,
    })
    .from(customers)
    .where(eq(customers.id, visit.customerId));

  // Get all modules for this visit
  const modules = await db
    .select()
    .from(surveyModules)
    .where(eq(surveyModules.visitSessionId, visit.id))
    .orderBy(surveyModules.startedAt);

  // Get observations
  const observations = await db
    .select()
    .from(visitObservations)
    .where(eq(visitObservations.visitSessionId, visit.id))
    .orderBy(desc(visitObservations.createdAt));

  // Get media (photos)
  const media = await db
    .select()
    .from(mediaAttachments)
    .where(eq(mediaAttachments.visitSessionId, visit.id))
    .orderBy(desc(mediaAttachments.uploadedAt));

  return c.json({
    visit: {
      id: visit.id,
      surveyType: visit.surveyType,
      status: visit.status,
      startedAt: visit.startedAt,
      completedAt: visit.completedAt,
      weatherConditions: visit.weatherConditions,
      notes: visit.notes,
    },
    customer,
    modules,
    observations,
    media,
  });
});

export default app;
