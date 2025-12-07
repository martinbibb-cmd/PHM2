import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, Mail, Phone, MapPin, Edit, Plus } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/customers/$id')({
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { id } = Route.useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'visits' | 'appointments'>(
    'overview'
  );

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const response = await api.get(`/customers/${id}`);
      return response.customer;
    },
  });

  const { data: quotes } = useQuery({
    queryKey: ['customer-quotes', id],
    queryFn: async () => {
      const response = await api.get(`/quotes?customerId=${id}`);
      return response.quotes;
    },
  });

  const { data: visits } = useQuery({
    queryKey: ['customer-visits', id],
    queryFn: async () => {
      const response = await api.get(`/visits?customerId=${id}`);
      return response.visits;
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ['customer-appointments', id],
    queryFn: async () => {
      const response = await api.get(`/appointments?customerId=${id}`);
      return response.appointments;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading customer...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto p-6">
        <p>Customer not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link to="/customers">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">
              {customer.firstName} {customer.lastName}
            </h1>
            <div className="flex gap-4 mt-2 text-gray-600">
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
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/quotes/new?customerId=${id}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Quote
              </Button>
            </Link>
            <Link to={`/customers/${id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b mb-6">
        <div className="flex gap-6">
          {(['overview', 'quotes', 'visits', 'appointments'] as const).map((tab) => (
            <button
              key={tab}
              className={`pb-3 px-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Property Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600">Address</dt>
                <dd className="font-medium">
                  {customer.addressLine1}
                  {customer.addressLine2 && <>, {customer.addressLine2}</>}
                  <br />
                  {customer.city}, {customer.postcode}
                </dd>
              </div>
              {customer.propertyType && (
                <div>
                  <dt className="text-sm text-gray-600">Property Type</dt>
                  <dd className="font-medium capitalize">{customer.propertyType}</dd>
                </div>
              )}
              {customer.constructionYear && (
                <div>
                  <dt className="text-sm text-gray-600">Construction Year</dt>
                  <dd className="font-medium">{customer.constructionYear}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notes & Tags</h2>
            {customer.tags && customer.tags.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {customer.tags.map((tag: string) => (
                    <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {customer.notes && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Notes</p>
                <p className="text-gray-800">{customer.notes}</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {quotes && quotes.length > 0 ? (
            quotes.map((quote: any) => (
              <Link key={quote.id} to={`/quotes/${quote.id}`}>
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{quote.title || `Quote #${quote.quoteNumber}`}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">£{parseFloat(quote.total).toFixed(2)}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          quote.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : quote.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-600 mb-4">No quotes yet</p>
              <Link to={`/quotes/new?customerId=${id}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quote
                </Button>
              </Link>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="space-y-4">
          {visits && visits.length > 0 ? (
            visits.map((visit: any) => (
              <Card key={visit.id} className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold capitalize">{visit.surveyType.replace('_', ' ')}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(visit.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded h-fit ${
                      visit.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {visit.status}
                  </span>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-600">No survey visits recorded</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {appointments && appointments.length > 0 ? (
            appointments.map((appointment: any) => (
              <Card key={appointment.id} className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold capitalize">
                      {appointment.appointmentType.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.scheduledStart).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded h-fit ${
                      appointment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-600">No appointments scheduled</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
