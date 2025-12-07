// Core entity types
export interface Account {
  id: number;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  isActive: boolean;
  createdAt: Date;
}

export interface User {
  id: number;
  accountId: number;
  email: string;
  name: string;
  passwordHash?: string;
  authProvider: 'local' | 'google' | 'salesforce';
  externalId?: string;
  role: 'admin' | 'surveyor' | 'office' | 'readonly';
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: number;
  accountId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode: string;
  country: string;
  propertyType?: 'detached' | 'semi' | 'terraced' | 'flat' | 'bungalow';
  constructionYear?: number;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: number;
  accountId: number;
  customerId: number;
  source?: string;
  campaign?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedValue?: number;
  lostReason?: string;
  notes?: string;
  nextFollowUp?: Date;
  assignedTo?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  accountId: number;
  sku: string;
  name: string;
  manufacturer?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  specifications?: Record<string, any>;
  costPrice?: number;
  sellPrice: number;
  laborHours?: number;
  warrantyYears?: number;
  stockLevel: number;
  minStockLevel: number;
  isActive: boolean;
  imageUrls?: string[];
  datasheetUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  id: number;
  accountId: number;
  customerId: number;
  leadId?: number;
  quoteNumber?: string;
  title?: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  validUntil?: Date;
  subtotal?: number;
  taxRate: number;
  taxAmount?: number;
  total?: number;
  depositAmount?: number;
  notes?: string;
  termsAndConditions?: string;
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteLine {
  id: number;
  quoteId: number;
  productId?: number;
  sortOrder: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  notes?: string;
}

export interface Appointment {
  id: number;
  accountId: number;
  customerId: number;
  quoteId?: number;
  appointmentType?: 'survey' | 'installation' | 'service' | 'callback';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  assignedTo?: number;
  location?: string;
  notes?: string;
  cancelledReason?: string;
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs for API requests/responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
}

export interface RegisterRequest {
  accountName: string;
  email: string;
  name: string;
  password: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode: string;
  country?: string;
  propertyType?: Customer['propertyType'];
  constructionYear?: number;
  notes?: string;
  tags?: string[];
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface CreateLeadRequest {
  customerId: number;
  source?: string;
  campaign?: string;
  priority?: Lead['priority'];
  estimatedValue?: number;
  notes?: string;
  nextFollowUp?: Date;
  assignedTo?: number;
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  status?: Lead['status'];
  lostReason?: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  manufacturer?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  specifications?: Record<string, any>;
  costPrice?: number;
  sellPrice: number;
  laborHours?: number;
  warrantyYears?: number;
  stockLevel?: number;
  minStockLevel?: number;
  imageUrls?: string[];
  datasheetUrl?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  isActive?: boolean;
}

export interface CreateQuoteRequest {
  customerId: number;
  leadId?: number;
  title?: string;
  validUntil?: Date;
  taxRate?: number;
  depositAmount?: number;
  notes?: string;
  termsAndConditions?: string;
  lines: Array<{
    productId?: number;
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    notes?: string;
  }>;
}

export interface UpdateQuoteRequest extends Partial<CreateQuoteRequest> {
  status?: Quote['status'];
}

// API response types
export interface ApiError {
  error: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
