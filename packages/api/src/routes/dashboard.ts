import { Hono } from 'hono';
import { db } from '../db/index.js';
import { customers, leads, quotes, appointments, visitSessions, quoteLines } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { eq, and, gte, lte, sql, count, sum } from 'drizzle-orm';

const app = new Hono();

// Apply authentication to all routes
app.use('*', authenticate);

// GET /api/dashboard/stats - Dashboard overview stats
app.get('/stats', async (c) => {
  const user = c.get('user');
  const { startDate, endDate } = c.req.query();

  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  // Total customers
  const [customerCount] = await db
    .select({ count: count() })
    .from(customers)
    .where(eq(customers.accountId, user.accountId));

  // Active leads
  const [activeLeadsCount] = await db
    .select({ count: count() })
    .from(leads)
    .where(
      and(
        eq(leads.accountId, user.accountId),
        sql`${leads.status} NOT IN ('converted', 'lost')`
      )
    );

  // Quotes in last period
  const [quotesCount] = await db
    .select({ count: count() })
    .from(quotes)
    .where(
      and(
        eq(quotes.accountId, user.accountId),
        gte(quotes.createdAt, start),
        lte(quotes.createdAt, end)
      )
    );

  // Accepted quotes value
  const [acceptedValue] = await db
    .select({ total: sum(quotes.total) })
    .from(quotes)
    .where(
      and(
        eq(quotes.accountId, user.accountId),
        eq(quotes.status, 'accepted'),
        gte(quotes.acceptedAt, start),
        lte(quotes.acceptedAt, end)
      )
    );

  // Upcoming appointments
  const [upcomingAppointments] = await db
    .select({ count: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.accountId, user.accountId),
        eq(appointments.status, 'scheduled'),
        gte(appointments.scheduledStart, new Date())
      )
    );

  // Completed surveys
  const [surveysCompleted] = await db
    .select({ count: count() })
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.accountId, user.accountId),
        eq(visitSessions.status, 'completed'),
        gte(visitSessions.completedAt, start),
        lte(visitSessions.completedAt, end)
      )
    );

  return c.json({
    totalCustomers: customerCount.count,
    activeLeads: activeLeadsCount.count,
    quotesIssued: quotesCount.count,
    revenue: parseFloat(acceptedValue.total || '0'),
    upcomingAppointments: upcomingAppointments.count,
    completedSurveys: surveysCompleted.count,
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
  });
});

// GET /api/dashboard/revenue - Revenue analytics
app.get('/revenue', async (c) => {
  const user = c.get('user');
  const { startDate, endDate, groupBy = 'month' } = c.req.query();

  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 12));
  const end = endDate ? new Date(endDate) : new Date();

  // Group by month or week
  const dateFormat = groupBy === 'week' ? '%Y-%W' : '%Y-%m';

  const revenue = await db
    .select({
      period: sql<string>`TO_CHAR(${quotes.acceptedAt}, ${dateFormat})`,
      total: sum(quotes.total),
      count: count(),
    })
    .from(quotes)
    .where(
      and(
        eq(quotes.accountId, user.accountId),
        eq(quotes.status, 'accepted'),
        gte(quotes.acceptedAt, start),
        lte(quotes.acceptedAt, end)
      )
    )
    .groupBy(sql`TO_CHAR(${quotes.acceptedAt}, ${dateFormat})`)
    .orderBy(sql`TO_CHAR(${quotes.acceptedAt}, ${dateFormat})`);

  return c.json({
    revenue: revenue.map((r) => ({
      period: r.period,
      total: parseFloat(r.total || '0'),
      count: r.count,
    })),
    groupBy,
  });
});

// GET /api/dashboard/conversion - Lead conversion funnel
app.get('/conversion', async (c) => {
  const user = c.get('user');

  // Leads by status
  const leadsByStatus = await db
    .select({
      status: leads.status,
      count: count(),
    })
    .from(leads)
    .where(eq(leads.accountId, user.accountId))
    .groupBy(leads.status);

  // Quotes by status
  const quotesByStatus = await db
    .select({
      status: quotes.status,
      count: count(),
      totalValue: sum(quotes.total),
    })
    .from(quotes)
    .where(eq(quotes.accountId, user.accountId))
    .groupBy(quotes.status);

  return c.json({
    leads: leadsByStatus,
    quotes: quotesByStatus.map((q) => ({
      status: q.status,
      count: q.count,
      totalValue: parseFloat(q.totalValue || '0'),
    })),
  });
});

// GET /api/dashboard/surveyor-performance - Surveyor efficiency metrics
app.get('/surveyor-performance', async (c) => {
  const user = c.get('user');
  const { startDate, endDate } = c.req.query();

  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const end = endDate ? new Date(endDate) : new Date();

  // Surveys completed per surveyor
  const surveyorStats = await db
    .select({
      surveyorId: visitSessions.surveyorId,
      completedSurveys: count(),
    })
    .from(visitSessions)
    .where(
      and(
        eq(visitSessions.accountId, user.accountId),
        eq(visitSessions.status, 'completed'),
        gte(visitSessions.completedAt, start),
        lte(visitSessions.completedAt, end)
      )
    )
    .groupBy(visitSessions.surveyorId);

  // Appointments completed per surveyor
  const appointmentStats = await db
    .select({
      assignedTo: appointments.assignedTo,
      completedAppointments: count(),
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.accountId, user.accountId),
        eq(appointments.status, 'completed'),
        gte(appointments.actualEnd, start),
        lte(appointments.actualEnd, end)
      )
    )
    .groupBy(appointments.assignedTo);

  return c.json({
    surveyors: surveyorStats,
    appointments: appointmentStats,
  });
});

// GET /api/dashboard/recent-activity - Recent customer activity
app.get('/recent-activity', async (c) => {
  const user = c.get('user');
  const limit = parseInt(c.req.query('limit') || '10');

  // Recent quotes
  const recentQuotes = await db
    .select()
    .from(quotes)
    .where(eq(quotes.accountId, user.accountId))
    .orderBy(sql`${quotes.createdAt} DESC`)
    .limit(limit);

  // Recent appointments
  const recentAppointments = await db
    .select()
    .from(appointments)
    .where(eq(appointments.accountId, user.accountId))
    .orderBy(sql`${appointments.createdAt} DESC`)
    .limit(limit);

  // Recent surveys
  const recentSurveys = await db
    .select()
    .from(visitSessions)
    .where(eq(visitSessions.accountId, user.accountId))
    .orderBy(sql`${visitSessions.startedAt} DESC`)
    .limit(limit);

  return c.json({
    quotes: recentQuotes,
    appointments: recentAppointments,
    surveys: recentSurveys,
  });
});

export default app;
