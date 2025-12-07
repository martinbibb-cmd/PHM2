import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card } from '../components/ui/card';
import { Users, FileText, Calendar, TrendingUp, DollarSign, Activity } from 'lucide-react';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response;
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: async () => {
      const response = await api.get('/dashboard/recent-activity?limit=5');
      return response;
    },
  });

  const statCards = [
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Leads',
      value: stats?.activeLeads || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Quotes Issued',
      value: stats?.quotesIssued || 0,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Revenue (30d)',
      value: `£${(stats?.revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Upcoming Appointments',
      value: stats?.upcomingAppointments || 0,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Completed Surveys',
      value: stats?.completedSurveys || 0,
      icon: Activity,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome to Project Hail Mary</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Quotes</h2>
          <div className="space-y-3">
            {recentActivity?.quotes?.map((quote: any) => (
              <Link key={quote.id} to={`/quotes/${quote.id}`}>
                <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium">{quote.quoteNumber}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">£{parseFloat(quote.total || 0).toFixed(2)}</p>
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
              </Link>
            ))}

            {(!recentActivity?.quotes || recentActivity.quotes.length === 0) && (
              <p className="text-gray-400 text-center py-4">No recent quotes</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
          <div className="space-y-3">
            {recentActivity?.appointments?.map((appointment: any) => (
              <div key={appointment.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium capitalize">
                      {appointment.appointmentType?.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.scheduledStart).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded h-fit ${
                      appointment.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}

            {(!recentActivity?.appointments || recentActivity.appointments.length === 0) && (
              <p className="text-gray-400 text-center py-4">No upcoming appointments</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
