import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card } from '../components/ui/card';
import { useState } from 'react';

export const Route = createFileRoute('/leads')({
  component: LeadsPage,
});

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 border-blue-300' },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 border-yellow-300' },
  qualified: { label: 'Qualified', color: 'bg-purple-100 border-purple-300' },
  converted: { label: 'Converted', color: 'bg-green-100 border-green-300' },
  lost: { label: 'Lost', color: 'bg-gray-100 border-gray-300' },
};

function LeadsPage() {
  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const response = await api.get('/leads');
      return response.leads;
    },
  });

  const groupedLeads = leads?.reduce((acc: Record<LeadStatus, any[]>, lead: any) => {
    const status = lead.status as LeadStatus;
    if (!acc[status]) acc[status] = [];
    acc[status].push(lead);
    return acc;
  }, {} as Record<LeadStatus, any[]>);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Lead Pipeline</h1>
        <p className="text-gray-600">Track your sales opportunities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {(['new', 'contacted', 'qualified', 'converted', 'lost'] as LeadStatus[]).map((status) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{statusConfig[status].label}</h2>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {groupedLeads?.[status]?.length || 0}
              </span>
            </div>

            <div className="space-y-2">
              {groupedLeads?.[status]?.map((lead: any) => (
                <Card key={lead.id} className={`p-3 border-2 ${statusConfig[status].color}`}>
                  <div className="font-medium text-sm mb-1">
                    {lead.customer?.firstName} {lead.customer?.lastName}
                  </div>
                  {lead.estimatedValue && (
                    <div className="text-sm font-semibold text-green-700">
                      £{parseFloat(lead.estimatedValue).toFixed(2)}
                    </div>
                  )}
                  {lead.source && (
                    <div className="text-xs text-gray-600 mt-1">
                      Source: {lead.source}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        lead.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : lead.priority === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {lead.priority}
                    </span>
                  </div>
                </Card>
              ))}

              {(!groupedLeads?.[status] || groupedLeads[status].length === 0) && (
                <div className="text-center text-gray-400 text-sm py-4">No leads</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
