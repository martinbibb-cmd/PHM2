import { pgTable, serial, varchar, text, boolean, timestamp, integer, numeric, date, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Core Tables

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  plan: varchar('plan', { length: 50 }).default('free').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  authProvider: varchar('auth_provider', { length: 50 }).default('local').notNull(),
  externalId: varchar('external_id', { length: 255 }),
  role: varchar('role', { length: 50 }).default('surveyor').notNull(),
  avatarUrl: text('avatar_url'),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  altPhone: varchar('alt_phone', { length: 50 }),
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 255 }),
  postcode: varchar('postcode', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).default('UK').notNull(),
  propertyType: varchar('property_type', { length: 50 }),
  constructionYear: integer('construction_year'),
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  source: varchar('source', { length: 100 }),
  campaign: varchar('campaign', { length: 255 }),
  status: varchar('status', { length: 50 }).default('new').notNull(),
  priority: varchar('priority', { length: 50 }).default('medium').notNull(),
  estimatedValue: numeric('estimated_value', { precision: 10, scale: 2 }),
  lostReason: text('lost_reason'),
  notes: text('notes'),
  nextFollowUp: timestamp('next_follow_up'),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  manufacturer: varchar('manufacturer', { length: 255 }),
  category: varchar('category', { length: 100 }),
  subcategory: varchar('subcategory', { length: 100 }),
  description: text('description'),
  specifications: jsonb('specifications').$type<Record<string, any>>(),
  costPrice: numeric('cost_price', { precision: 10, scale: 2 }),
  sellPrice: numeric('sell_price', { precision: 10, scale: 2 }).notNull(),
  laborHours: numeric('labor_hours', { precision: 5, scale: 2 }),
  warrantyYears: integer('warranty_years'),
  stockLevel: integer('stock_level').default(0).notNull(),
  minStockLevel: integer('min_stock_level').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  imageUrls: jsonb('image_urls').$type<string[]>(),
  datasheetUrl: text('datasheet_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  leadId: integer('lead_id').references(() => leads.id),
  quoteNumber: varchar('quote_number', { length: 50 }).unique(),
  title: varchar('title', { length: 255 }),
  status: varchar('status', { length: 50 }).default('draft').notNull(),
  validUntil: date('valid_until'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('20').notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }),
  total: numeric('total', { precision: 10, scale: 2 }),
  depositAmount: numeric('deposit_amount', { precision: 10, scale: 2 }),
  notes: text('notes'),
  termsAndConditions: text('terms_and_conditions'),
  sentAt: timestamp('sent_at'),
  viewedAt: timestamp('viewed_at'),
  acceptedAt: timestamp('accepted_at'),
  rejectedAt: timestamp('rejected_at'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quoteLines = pgTable('quote_lines', {
  id: serial('id').primaryKey(),
  quoteId: integer('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id),
  sortOrder: integer('sort_order').default(0).notNull(),
  description: text('description').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0').notNull(),
  lineTotal: numeric('line_total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  quoteId: integer('quote_id').references(() => quotes.id),
  appointmentType: varchar('appointment_type', { length: 50 }),
  status: varchar('status', { length: 50 }).default('scheduled').notNull(),
  scheduledStart: timestamp('scheduled_start').notNull(),
  scheduledEnd: timestamp('scheduled_end').notNull(),
  actualStart: timestamp('actual_start'),
  actualEnd: timestamp('actual_end'),
  assignedTo: integer('assigned_to').references(() => users.id),
  location: varchar('location', { length: 255 }),
  notes: text('notes'),
  cancelledReason: text('cancelled_reason'),
  reminderSentAt: timestamp('reminder_sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Survey & Voice System Tables

export const visitSessions = pgTable('visit_sessions', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  appointmentId: integer('appointment_id').references(() => appointments.id),
  surveyType: varchar('survey_type', { length: 50 }),
  status: varchar('status', { length: 50 }).default('in_progress').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  surveyorId: integer('surveyor_id').references(() => users.id),
  weatherConditions: varchar('weather_conditions', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const surveyModules = pgTable('survey_modules', {
  id: serial('id').primaryKey(),
  visitSessionId: integer('visit_session_id').notNull().references(() => visitSessions.id, { onDelete: 'cascade' }),
  moduleType: varchar('module_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('in_progress').notNull(),
  data: jsonb('data').$type<Record<string, any>>(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const transcriptions = pgTable('transcriptions', {
  id: serial('id').primaryKey(),
  visitSessionId: integer('visit_session_id').notNull().references(() => visitSessions.id, { onDelete: 'cascade' }),
  moduleId: integer('module_id').references(() => surveyModules.id),
  audioUrl: text('audio_url'),
  transcriptText: text('transcript_text').notNull(),
  confidence: numeric('confidence', { precision: 3, scale: 2 }),
  language: varchar('language', { length: 10 }).default('en-GB').notNull(),
  durationSeconds: integer('duration_seconds'),
  recordedAt: timestamp('recorded_at').notNull(),
  processedAt: timestamp('processed_at').defaultNow().notNull(),
});

export const visitObservations = pgTable('visit_observations', {
  id: serial('id').primaryKey(),
  visitSessionId: integer('visit_session_id').notNull().references(() => visitSessions.id, { onDelete: 'cascade' }),
  transcriptionId: integer('transcription_id').references(() => transcriptions.id),
  observationType: varchar('observation_type', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  key: varchar('key', { length: 255 }).notNull(),
  value: text('value').notNull(),
  confidence: varchar('confidence', { length: 20 }).default('high').notNull(),
  context: text('context'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mediaAttachments = pgTable('media_attachments', {
  id: serial('id').primaryKey(),
  visitSessionId: integer('visit_session_id').notNull().references(() => visitSessions.id, { onDelete: 'cascade' }),
  moduleId: integer('module_id').references(() => surveyModules.id),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  caption: text('caption'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  thumbnailPath: text('thumbnail_path'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

export const boilerSpecifications = pgTable('boiler_specifications', {
  id: serial('id').primaryKey(),
  manufacturer: varchar('manufacturer', { length: 255 }).notNull(),
  model: varchar('model', { length: 255 }).notNull(),
  fuelType: varchar('fuel_type', { length: 50 }),
  boilerType: varchar('boiler_type', { length: 50 }),
  outputKw: numeric('output_kw', { precision: 5, scale: 2 }),
  flowRateLpm: numeric('flow_rate_lpm', { precision: 5, scale: 2 }),
  dimensions: jsonb('dimensions').$type<{ height: number; width: number; depth: number }>(),
  weight: numeric('weight', { precision: 6, scale: 2 }),
  efficiency: numeric('efficiency', { precision: 4, scale: 2 }),
  erpRating: varchar('erp_rating', { length: 5 }),
  flueType: varchar('flue_type', { length: 50 }),
  minGasPressure: numeric('min_gas_pressure', { precision: 4, scale: 2 }),
  maxGasPressure: numeric('max_gas_pressure', { precision: 4, scale: 2 }),
  warranty: integer('warranty'),
  installDate: date('install_date'),
  discontinuedDate: date('discontinued_date'),
  replacementModel: varchar('replacement_model', { length: 255 }),
  datasheetUrl: text('datasheet_url'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// System Tables

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').references(() => accounts.id),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: integer('entity_id'),
  changes: jsonb('changes').$type<Record<string, any>>(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').references(() => accounts.id),
  templateKey: varchar('template_key', { length: 100 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text').notNull(),
  variables: jsonb('variables').$type<Record<string, string>>(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations

export const accountsRelations = relations(accounts, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  leads: many(leads),
  products: many(products),
  quotes: many(quotes),
  appointments: many(appointments),
  visitSessions: many(visitSessions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  account: one(accounts, {
    fields: [users.accountId],
    references: [accounts.id],
  }),
  assignedLeads: many(leads),
  assignedAppointments: many(appointments),
  createdQuotes: many(quotes),
  surveySessions: many(visitSessions),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  account: one(accounts, {
    fields: [customers.accountId],
    references: [accounts.id],
  }),
  leads: many(leads),
  quotes: many(quotes),
  appointments: many(appointments),
  visitSessions: many(visitSessions),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  account: one(accounts, {
    fields: [leads.accountId],
    references: [accounts.id],
  }),
  customer: one(customers, {
    fields: [leads.customerId],
    references: [customers.id],
  }),
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  account: one(accounts, {
    fields: [products.accountId],
    references: [accounts.id],
  }),
  quoteLines: many(quoteLines),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  account: one(accounts, {
    fields: [quotes.accountId],
    references: [accounts.id],
  }),
  customer: one(customers, {
    fields: [quotes.customerId],
    references: [customers.id],
  }),
  lead: one(leads, {
    fields: [quotes.leadId],
    references: [leads.id],
  }),
  createdByUser: one(users, {
    fields: [quotes.createdBy],
    references: [users.id],
  }),
  lines: many(quoteLines),
  appointments: many(appointments),
}));

export const quoteLinesRelations = relations(quoteLines, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteLines.quoteId],
    references: [quotes.id],
  }),
  product: one(products, {
    fields: [quoteLines.productId],
    references: [products.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  account: one(accounts, {
    fields: [appointments.accountId],
    references: [accounts.id],
  }),
  customer: one(customers, {
    fields: [appointments.customerId],
    references: [customers.id],
  }),
  quote: one(quotes, {
    fields: [appointments.quoteId],
    references: [quotes.id],
  }),
  assignedUser: one(users, {
    fields: [appointments.assignedTo],
    references: [users.id],
  }),
  visitSessions: many(visitSessions),
}));

export const visitSessionsRelations = relations(visitSessions, ({ one, many }) => ({
  account: one(accounts, {
    fields: [visitSessions.accountId],
    references: [accounts.id],
  }),
  customer: one(customers, {
    fields: [visitSessions.customerId],
    references: [customers.id],
  }),
  appointment: one(appointments, {
    fields: [visitSessions.appointmentId],
    references: [appointments.id],
  }),
  surveyor: one(users, {
    fields: [visitSessions.surveyorId],
    references: [users.id],
  }),
  modules: many(surveyModules),
  transcriptions: many(transcriptions),
  observations: many(visitObservations),
  media: many(mediaAttachments),
}));

export const surveyModulesRelations = relations(surveyModules, ({ one, many }) => ({
  visitSession: one(visitSessions, {
    fields: [surveyModules.visitSessionId],
    references: [visitSessions.id],
  }),
  transcriptions: many(transcriptions),
  media: many(mediaAttachments),
}));

export const transcriptionsRelations = relations(transcriptions, ({ one, many }) => ({
  visitSession: one(visitSessions, {
    fields: [transcriptions.visitSessionId],
    references: [visitSessions.id],
  }),
  module: one(surveyModules, {
    fields: [transcriptions.moduleId],
    references: [surveyModules.id],
  }),
  observations: many(visitObservations),
}));

export const visitObservationsRelations = relations(visitObservations, ({ one }) => ({
  visitSession: one(visitSessions, {
    fields: [visitObservations.visitSessionId],
    references: [visitSessions.id],
  }),
  transcription: one(transcriptions, {
    fields: [visitObservations.transcriptionId],
    references: [transcriptions.id],
  }),
}));

export const mediaAttachmentsRelations = relations(mediaAttachments, ({ one }) => ({
  visitSession: one(visitSessions, {
    fields: [mediaAttachments.visitSessionId],
    references: [visitSessions.id],
  }),
  module: one(surveyModules, {
    fields: [mediaAttachments.moduleId],
    references: [surveyModules.id],
  }),
}));
