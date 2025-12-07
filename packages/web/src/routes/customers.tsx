import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Search, Plus, MapPin, Mail, Phone, Calendar } from 'lucide-react';

export const Route = createFileRoute('/customers')({
  component: CustomersPage,
});

function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState<string>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', searchQuery, propertyType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (propertyType) params.set('propertyType', propertyType);

      const response = await api.get(`/customers?${params.toString()}`);
      return response.customers;
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <Link to="/customers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customers..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="border rounded-md px-4 py-2"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
        >
          <option value="">All Property Types</option>
          <option value="detached">Detached</option>
          <option value="semi">Semi-Detached</option>
          <option value="terraced">Terraced</option>
          <option value="flat">Flat</option>
          <option value="bungalow">Bungalow</option>
        </select>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading customers...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error loading customers. Please try again.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((customer: any) => (
          <Link key={customer.id} to={`/customers/${customer.id}`}>
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  {customer.propertyType && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {customer.propertyType}
                    </span>
                  )}
                </div>
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex gap-1">
                    {customer.tags.slice(0, 2).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.postcode && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {customer.city}, {customer.postcode}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Added {new Date(customer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {customer.notes && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{customer.notes}</p>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {data && data.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No customers found</p>
          <Link to="/customers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Customer
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
