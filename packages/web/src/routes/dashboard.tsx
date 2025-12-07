import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Package, TrendingUp } from 'lucide-react';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  beforeLoad: ({ context }) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
  },
});

function DashboardPage() {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();

  const logoutMutation = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      clearUser();
      navigate({ to: '/' });
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 5 }],
    queryFn: () => api.getCustomers({ page: 1, pageSize: 5 }),
  });

  const { data: leads } = useQuery({
    queryKey: ['leads', { page: 1, pageSize: 5 }],
    queryFn: () => api.getLeads({ page: 1, pageSize: 5 }),
  });

  const { data: quotes } = useQuery({
    queryKey: ['quotes', { page: 1, pageSize: 5 }],
    queryFn: () => api.getQuotes({ page: 1, pageSize: 5 }),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">PHM</h1>
            <nav className="flex gap-4">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                to="/customers"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Customers
              </Link>
              <Link
                to="/leads"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Leads
              </Link>
              <Link
                to="/products"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Products
              </Link>
              <Link
                to="/quotes"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Quotes
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user?.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers?.pagination.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active customer accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Leads
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leads?.pagination.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                In pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quotes
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotes?.pagination.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total quotes created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                In catalog
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>
                Latest customer records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customers?.data.length ? (
                <div className="space-y-2">
                  {customers.data.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {customer.postcode}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No customers yet
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Quotes</CardTitle>
              <CardDescription>
                Latest quote activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quotes?.data.length ? (
                <div className="space-y-2">
                  {quotes.data.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">{quote.quoteNumber}</p>
                        <p className="text-sm text-gray-600">
                          {quote.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No quotes yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
