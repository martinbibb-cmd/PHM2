import { useCognitiveProfileStore, CognitiveProfile } from '../stores/cognitiveProfileStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Zap, Eye, Heart, Check } from 'lucide-react';

interface ProfileOption {
  id: CognitiveProfile;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  features: string[];
  color: string;
}

const PROFILES: ProfileOption[] = [
  {
    id: 'default',
    name: 'Default',
    icon: Check,
    description: 'Standard interface with no special adaptations',
    features: [
      'Standard layout and navigation',
      'Default colors and fonts',
      'Immediate interactions',
    ],
    color: 'text-gray-600',
  },
  {
    id: 'laser-focus',
    name: 'Laser Focus',
    icon: Zap,
    description: 'Optimized for ADHD and executive dysfunction',
    features: [
      'Focus Mode to minimize distractions',
      'Parking Lot for quick idea capture',
      'Visual timers for time awareness',
      'Gamification with celebrations',
    ],
    color: 'text-yellow-600',
  },
  {
    id: 'clarity',
    name: 'Clarity',
    icon: Eye,
    description: 'Enhanced readability for dyslexia and visual processing',
    features: [
      'Dyslexia-friendly font (OpenDyslexic)',
      'Reading ruler to track lines',
      'Optional bionic reading mode',
      'Larger touch targets',
    ],
    color: 'text-blue-600',
  },
  {
    id: 'calm',
    name: 'Calm',
    icon: Heart,
    description: 'Reduced anxiety for OCD and overstimulation',
    features: [
      'Hidden notification badges',
      'Soft, constructive error messages',
      'Hold-to-confirm for destructive actions',
      'Muted, low-saturation colors',
    ],
    color: 'text-purple-600',
  },
];

export function ProfileSelector() {
  const { profile, setProfile, settings, updateSettings } = useCognitiveProfileStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Cognitive Profiles</h2>
        <p className="text-muted-foreground">
          Choose a profile that matches how your brain works best. Each profile is designed
          to empower specific thinking styles.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PROFILES.map((profileOption) => {
          const Icon = profileOption.icon;
          const isActive = profile === profileOption.id;

          return (
            <Card
              key={profileOption.id}
              className={`cursor-pointer transition-all ${
                isActive
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:shadow-md hover:border-primary/50'
              }`}
              onClick={() => setProfile(profileOption.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`${isActive ? 'bg-primary' : 'bg-muted'} p-2 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${isActive ? 'text-primary-foreground' : profileOption.color}`} />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {profileOption.name}
                      {isActive && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{profileOption.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {profileOption.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {profile !== 'default' && (
        <Card>
          <CardHeader>
            <CardTitle>Fine-tune Your Profile</CardTitle>
            <CardDescription>
              Customize individual features to match your preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Laser Focus Settings */}
            {profile === 'laser-focus' && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="focusMode" className="flex-1">
                    <div className="font-medium">Focus Mode</div>
                    <div className="text-sm text-muted-foreground">
                      Hide everything except current task
                    </div>
                  </Label>
                  <Button
                    id="focusMode"
                    variant={settings.focusModeEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      updateSettings({ focusModeEnabled: !settings.focusModeEnabled })
                    }
                  >
                    {settings.focusModeEnabled ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="parkingLot" className="flex-1">
                    <div className="font-medium">Parking Lot</div>
                    <div className="text-sm text-muted-foreground">
                      Quick capture for ideas without losing focus
                    </div>
                  </Label>
                  <Button
                    id="parkingLot"
                    variant={settings.showParkingLot ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      updateSettings({ showParkingLot: !settings.showParkingLot })
                    }
                  >
                    {settings.showParkingLot ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="gamification" className="flex-1">
                    <div className="font-medium">Celebrations</div>
                    <div className="text-sm text-muted-foreground">
                      Visual confetti when completing tasks
                    </div>
                  </Label>
                  <Button
                    id="gamification"
                    variant={settings.gamificationEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      updateSettings({ gamificationEnabled: !settings.gamificationEnabled })
                    }
                  >
                    {settings.gamificationEnabled ? 'On' : 'Off'}
                  </Button>
                </div>
              </>
            )}

            {/* Clarity Settings */}
            {profile === 'clarity' && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="readingRuler" className="flex-1">
                    <div className="font-medium">Reading Ruler</div>
                    <div className="text-sm text-muted-foreground">
                      Highlight bar that follows your cursor
                    </div>
                  </Label>
                  <Button
                    id="readingRuler"
                    variant={settings.readingRulerEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      updateSettings({ readingRulerEnabled: !settings.readingRulerEnabled })
                    }
                  >
                    {settings.readingRulerEnabled ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="bionicReading" className="flex-1">
                    <div className="font-medium">Bionic Reading</div>
                    <div className="text-sm text-muted-foreground">
                      Bold first letters of words for faster recognition
                    </div>
                  </Label>
                  <Button
                    id="bionicReading"
                    variant={settings.bionicReadingEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      updateSettings({ bionicReadingEnabled: !settings.bionicReadingEnabled })
                    }
                  >
                    {settings.bionicReadingEnabled ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                  <strong>Note:</strong> The OpenDyslexic font is automatically applied when
                  using the Clarity profile. If you prefer, you can use Comic Sans MS as a
                  fallback.
                </div>
              </>
            )}

            {/* Calm Settings */}
            {profile === 'calm' && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hideNotifications" className="flex-1">
                    <div className="font-medium">Hide Notification Badges</div>
                    <div className="text-sm text-muted-foreground">
                      Reduce visual clutter and anxiety triggers
                    </div>
                  </Label>
                  <Button
                    id="hideNotifications"
                    variant={settings.hideNotificationBadges ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      updateSettings({
                        hideNotificationBadges: !settings.hideNotificationBadges,
                      })
                    }
                  >
                    {settings.hideNotificationBadges ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="softErrors" className="flex-1">
                    <div className="font-medium">Soft Errors</div>
                    <div className="text-sm text-muted-foreground">
                      Constructive, calm error messages instead of alarming
                    </div>
                  </Label>
                  <Button
                    id="softErrors"
                    variant={settings.softErrorsEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      updateSettings({ softErrorsEnabled: !settings.softErrorsEnabled })
                    }
                  >
                    {settings.softErrorsEnabled ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="confirmActions" className="flex-1">
                    <div className="font-medium">Confirm Destructive Actions</div>
                    <div className="text-sm text-muted-foreground">
                      Hold buttons to confirm, preventing accidental clicks
                    </div>
                  </Label>
                  <Button
                    id="confirmActions"
                    variant={settings.confirmDestructiveActions ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      updateSettings({
                        confirmDestructiveActions: !settings.confirmDestructiveActions,
                      })
                    }
                  >
                    {settings.confirmDestructiveActions ? 'On' : 'Off'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Why Cognitive Profiles?</h3>
        <p className="text-sm text-muted-foreground">
          Everyone's brain works differently. These profiles go beyond basic accessibility
          to create an experience that truly understands and adapts to your cognitive style.
          Try different profiles to find what works best for you—there's no "right" choice!
        </p>
      </div>
    </div>
  );
}
