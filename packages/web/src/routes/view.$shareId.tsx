import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { format } from 'date-fns';

export const Route = createFileRoute('/view/$shareId')({
  component: CustomerViewPage,
});

function CustomerViewPage() {
  const { shareId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-visit', shareId],
    queryFn: () => api.getPublicVisit(shareId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg">Loading your survey results...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Survey Not Found</CardTitle>
            <CardDescription>
              This survey link may have expired or is invalid.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { visit, customer, modules, observations, media } = data.data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Property Survey Report</h1>
          <p className="text-gray-600 mt-2">
            Completed on {visit.completedAt ? format(new Date(visit.completedAt), 'MMMM d, yyyy') : 'In Progress'}
          </p>
        </div>

        {/* Customer & Property Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer && (
              <>
                <div>
                  <span className="font-semibold">Property Owner:</span>{' '}
                  {customer.firstName} {customer.lastName}
                </div>
                <div>
                  <span className="font-semibold">Address:</span>{' '}
                  {[customer.addressLine1, customer.addressLine2, customer.city, customer.postcode]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                {customer.propertyType && (
                  <div>
                    <span className="font-semibold">Property Type:</span>{' '}
                    {customer.propertyType.replace('_', ' ').charAt(0).toUpperCase() + customer.propertyType.slice(1)}
                  </div>
                )}
                {customer.constructionYear && (
                  <div>
                    <span className="font-semibold">Construction Year:</span>{' '}
                    {customer.constructionYear}
                  </div>
                )}
              </>
            )}
            {visit.weatherConditions && (
              <div>
                <span className="font-semibold">Survey Conditions:</span>{' '}
                {visit.weatherConditions}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Survey Type */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Survey Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium capitalize">
              {visit.surveyType?.replace(/_/g, ' ')} Survey
            </div>
          </CardContent>
        </Card>

        {/* Survey Modules */}
        {modules && modules.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Survey Modules Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {modules.map((module: any) => (
                  <div key={module.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="font-semibold capitalize">
                      {module.moduleType.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      Status: <span className="capitalize">{module.status}</span>
                    </div>
                    {module.data && Object.keys(module.data).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(module.data).map(([key, value]: [string, any]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium">{key.replace(/_/g, ' ')}:</span>{' '}
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Observations & Findings */}
        {observations && observations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Survey Observations</CardTitle>
              <CardDescription>
                Key findings from your property survey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {observations.map((obs: any) => (
                  <div key={obs.id} className="border-l-4 border-green-500 pl-4">
                    <div className="font-semibold capitalize">{obs.observationType.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-600 mb-1">
                      Category: <span className="capitalize">{obs.category}</span>
                    </div>
                    <div>
                      <span className="font-medium">{obs.key}:</span> {obs.value}
                    </div>
                    {obs.context && (
                      <div className="mt-1 text-sm text-gray-600">
                        {obs.context}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photos & Media */}
        {media && media.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Survey Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {media.map((item: any) => (
                  <div key={item.id} className="space-y-2">
                    {item.fileType === 'image' && (
                      <img
                        src={`/api/media/${item.id}`}
                        alt={item.caption || item.fileName}
                        className="w-full rounded-lg border"
                      />
                    )}
                    {item.caption && (
                      <p className="text-sm text-gray-600">{item.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Notes */}
        {visit.notes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{visit.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 pb-8">
          <p>This is a read-only view of your property survey.</p>
          <p className="mt-1">For questions or concerns, please contact your surveyor.</p>
        </div>
      </div>
    </div>
  );
}
