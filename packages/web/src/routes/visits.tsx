import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareVisitDialog } from '@/components/ShareVisitDialog';
import { Share2 } from 'lucide-react';

export const Route = createFileRoute('/visits')({
  component: VisitsPage,
});

function VisitsPage() {
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  // Mock data for demonstration - in real app this would come from API
  const mockVisits = [
    { id: 1, customerName: 'John Smith', surveyType: 'boiler', status: 'completed', completedAt: '2024-12-05' },
    { id: 2, customerName: 'Jane Doe', surveyType: 'heat_pump', status: 'completed', completedAt: '2024-12-06' },
    { id: 3, customerName: 'Bob Wilson', surveyType: 'full_home', status: 'in_progress', completedAt: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <h1 className="text-3xl font-bold mb-8">Visit Sessions</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Visits List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Surveys</h2>
            {mockVisits.map((visit) => (
              <Card key={visit.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{visit.customerName}</span>
                    <span className={`text-sm font-normal px-2 py-1 rounded ${
                      visit.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {visit.status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Survey Type:</span>{' '}
                      {visit.surveyType.replace(/_/g, ' ')}
                    </p>
                    {visit.completedAt && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Completed:</span> {visit.completedAt}
                      </p>
                    )}
                    {visit.status === 'completed' && (
                      <Button
                        onClick={() => setSelectedVisitId(visit.id)}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share with Customer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Share Dialog */}
          <div>
            {selectedVisitId ? (
              <div className="sticky top-8">
                <ShareVisitDialog visitId={selectedVisitId} />
                <Button
                  onClick={() => setSelectedVisitId(null)}
                  variant="ghost"
                  className="mt-4 w-full"
                >
                  Close
                </Button>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Share Survey</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Select a completed survey from the left to generate a shareable link and QR code for your customer.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
