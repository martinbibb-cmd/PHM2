import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import * as dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import customersRoutes from './routes/customers.js';
import leadsRoutes from './routes/leads.js';
import productsRoutes from './routes/products.js';
import quotesRoutes from './routes/quotes.js';
import appointmentsRoutes from './routes/appointments.js';
import visitsRoutes from './routes/visits.js';
import transcriptionRoutes from './routes/transcription.js';
import mediaRoutes from './routes/media.js';
import boilersRoutes from './routes/boilers.js';
import dashboardRoutes from './routes/dashboard.js';
import usersRoutes from './routes/users.js';
import publicRoutes from './routes/public.js';

// Load environment variables
dotenv.config({ path: '../../.env' });

const app = new Hono();

// Global middleware
app.use('*', honoLogger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'phm-api',
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/customers', customersRoutes);
app.route('/api/leads', leadsRoutes);
app.route('/api/products', productsRoutes);
app.route('/api/quotes', quotesRoutes);
app.route('/api/appointments', appointmentsRoutes);
app.route('/api/visits', visitsRoutes);
app.route('/api/transcription', transcriptionRoutes);
app.route('/api/media', mediaRoutes);
app.route('/api/boilers', boilersRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/users', usersRoutes);

// Public routes (no authentication required)
app.route('/api/public', publicRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'NotFound',
    message: 'Route not found',
    path: c.req.path,
  }, 404);
});

// Error handler
app.onError(errorHandler);

// Start server
const port = parseInt(process.env.PORT || '3001');

logger.info({ port }, 'Starting PHM API server');

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  logger.info(`🚀 Server running at http://localhost:${info.port}`);
  logger.info(`📊 Health check: http://localhost:${info.port}/health`);
  logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
