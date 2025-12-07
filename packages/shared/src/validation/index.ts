import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  accountName: z.string().min(2, 'Account name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
});

// Customer schemas
export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  altPhone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().min(1, 'Postcode is required'),
  country: z.string().default('UK'),
  propertyType: z.enum(['detached', 'semi', 'terraced', 'flat', 'bungalow']).optional(),
  constructionYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// Lead schemas
export const createLeadSchema = z.object({
  customerId: z.number().int().positive('Customer ID is required'),
  source: z.string().optional(),
  campaign: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimatedValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  nextFollowUp: z.coerce.date().optional(),
  assignedTo: z.number().int().positive().optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  lostReason: z.string().optional(),
});

// Product schemas
export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  manufacturer: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  specifications: z.record(z.any()).optional(),
  costPrice: z.number().min(0).optional(),
  sellPrice: z.number().min(0, 'Sell price is required'),
  laborHours: z.number().min(0).optional(),
  warrantyYears: z.number().int().min(0).optional(),
  stockLevel: z.number().int().min(0).default(0),
  minStockLevel: z.number().int().min(0).default(0),
  imageUrls: z.array(z.string().url()).optional(),
  datasheetUrl: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Quote schemas
export const quoteLineSchema = z.object({
  productId: z.number().int().positive().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.number().min(0, 'Unit price is required'),
  discount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const createQuoteSchema = z.object({
  customerId: z.number().int().positive('Customer ID is required'),
  leadId: z.number().int().positive().optional(),
  title: z.string().optional(),
  validUntil: z.coerce.date().optional(),
  taxRate: z.number().min(0).max(100).default(20),
  depositAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  lines: z.array(quoteLineSchema).min(1, 'At least one line item is required'),
});

export const updateQuoteSchema = createQuoteSchema.partial().extend({
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).optional(),
});

// Appointment schemas
export const createAppointmentSchema = z.object({
  customerId: z.number().int().positive('Customer ID is required'),
  quoteId: z.number().int().positive().optional(),
  appointmentType: z.enum(['survey', 'installation', 'service', 'callback']).optional(),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
  assignedTo: z.number().int().positive().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.scheduledEnd > data.scheduledStart,
  {
    message: 'End time must be after start time',
    path: ['scheduledEnd'],
  }
);

export const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  actualStart: z.coerce.date().optional(),
  actualEnd: z.coerce.date().optional(),
  cancelledReason: z.string().optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Query schemas
export const customerQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  propertyType: z.enum(['detached', 'semi', 'terraced', 'flat', 'bungalow']).optional(),
  tags: z.string().optional(), // comma-separated
});

export const leadQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
});

export const productQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const quoteQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).optional(),
  customerId: z.coerce.number().int().positive().optional(),
});

export const appointmentQuerySchema = paginationSchema.extend({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
});

// Export types from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type QuoteLineInput = z.infer<typeof quoteLineSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
export type LeadQueryInput = z.infer<typeof leadQuerySchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type QuoteQueryInput = z.infer<typeof quoteQuerySchema>;
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;
