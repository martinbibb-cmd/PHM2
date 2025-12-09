import { createFileRoute } from '@tanstack/react-router';
import { ProfileSelector } from '../components/ProfileSelector';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Customize your experience to match how you think and work
        </p>
      </div>

      <ProfileSelector />
    </div>
  );
}
