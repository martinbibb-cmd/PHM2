import { ReactNode } from 'react';
import { useCognitiveProfileStore } from '../../stores/cognitiveProfileStore';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface FocusModeProps {
  children: ReactNode;
  onExit?: () => void;
}

export function FocusMode({ children, onExit }: FocusModeProps) {
  const { settings, updateSettings } = useCognitiveProfileStore();

  if (!settings.focusModeEnabled) return <>{children}</>;

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      updateSettings({ focusModeEnabled: false });
    }
  };

  return (
    <>
      {/* Overlay to dim everything else */}
      <div className="focus-mode-overlay" onClick={handleExit} />

      {/* Focused content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
        <div className="relative w-full max-w-4xl bg-background rounded-lg shadow-2xl">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10"
            onClick={handleExit}
            title="Exit Focus Mode (Esc)"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
}

interface FocusModeToggleProps {
  label?: string;
}

export function FocusModeToggle({ label = 'Focus Mode' }: FocusModeToggleProps) {
  const { settings, updateSettings } = useCognitiveProfileStore();

  // Only show if profile supports focus mode
  if (settings.focusModeEnabled === undefined) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => updateSettings({ focusModeEnabled: !settings.focusModeEnabled })}
      className={settings.focusModeEnabled ? 'bg-primary/10' : ''}
    >
      {label}: {settings.focusModeEnabled ? 'On' : 'Off'}
    </Button>
  );
}
