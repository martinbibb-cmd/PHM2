import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  Lead,
  CreateLeadInput,
  UpdateLeadInput,
  Product,
  CreateProductInput,
  UpdateProductInput,
  Quote,
  CreateQuoteInput,
  UpdateQuoteInput,
  PaginatedResponse,
  ApiResponse,
  User,
} from '@phm/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown',
        message: 'An error occurred',
      }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/me');
  }

  // Customers endpoints
  async getCustomers(params?: Record<string, any>): Promise<PaginatedResponse<Customer>> {
    const query = new URLSearchParams(params).toString();
    return this.request(`/customers?${query}`);
  }

  async getCustomer(id: number): Promise<ApiResponse<Customer>> {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(data: CreateCustomerInput): Promise<ApiResponse<Customer>> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(
    id: number,
    data: UpdateCustomerInput
  ): Promise<ApiResponse<Customer>> {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: number): Promise<void> {
    return this.request(`/customers/${id}`, { method: 'DELETE' });
  }

  // Leads endpoints
  async getLeads(params?: Record<string, any>): Promise<PaginatedResponse<Lead>> {
    const query = new URLSearchParams(params).toString();
    return this.request(`/leads?${query}`);
  }

  async getLead(id: number): Promise<ApiResponse<Lead>> {
    return this.request(`/leads/${id}`);
  }

  async createLead(data: CreateLeadInput): Promise<ApiResponse<Lead>> {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLead(id: number, data: UpdateLeadInput): Promise<ApiResponse<Lead>> {
    return this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLead(id: number): Promise<void> {
    return this.request(`/leads/${id}`, { method: 'DELETE' });
  }

  // Products endpoints
  async getProducts(params?: Record<string, any>): Promise<PaginatedResponse<Product>> {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products?${query}`);
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.request(`/products/${id}`);
  }

  async searchProducts(q: string, limit = 10): Promise<ApiResponse<Product[]>> {
    return this.request(`/products/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  }

  async createProduct(data: CreateProductInput): Promise<ApiResponse<Product>> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(
    id: number,
    data: UpdateProductInput
  ): Promise<ApiResponse<Product>> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Quotes endpoints
  async getQuotes(params?: Record<string, any>): Promise<PaginatedResponse<Quote>> {
    const query = new URLSearchParams(params).toString();
    return this.request(`/quotes?${query}`);
  }

  async getQuote(id: number): Promise<ApiResponse<Quote>> {
    return this.request(`/quotes/${id}`);
  }

  async createQuote(data: CreateQuoteInput): Promise<ApiResponse<Quote>> {
    return this.request('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuote(id: number, data: UpdateQuoteInput): Promise<ApiResponse<Quote>> {
    return this.request(`/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuote(id: number): Promise<void> {
    return this.request(`/quotes/${id}`, { method: 'DELETE' });
  }

  async sendQuote(id: number): Promise<ApiResponse<Quote>> {
    return this.request(`/quotes/${id}/send`, { method: 'POST' });
  }

  async acceptQuote(id: number): Promise<ApiResponse<Quote>> {
    return this.request(`/quotes/${id}/accept`, { method: 'POST' });
  }

  async rejectQuote(id: number): Promise<ApiResponse<Quote>> {
    return this.request(`/quotes/${id}/reject`, { method: 'POST' });
  }

  async duplicateQuote(id: number): Promise<ApiResponse<Quote>> {
    return this.request(`/quotes/${id}/duplicate`, { method: 'POST' });
  }

  // Public endpoints (no auth required)
  async getPublicVisit(shareId: string): Promise<ApiResponse<any>> {
    return this.request(`/public/view/${shareId}`);
  }

  // Visit sharing endpoints
  async generateVisitShare(visitId: number): Promise<ApiResponse<{ shareId: string; shareUrl: string }>> {
    return this.request(`/visits/${visitId}/share`, { method: 'POST' });
  }
}

export const api = new ApiClient();
