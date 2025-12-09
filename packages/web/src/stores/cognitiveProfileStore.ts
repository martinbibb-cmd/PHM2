import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CognitiveProfile = 'default' | 'laser-focus' | 'clarity' | 'calm';

export interface ProfileSettings {
  // Laser Focus (ADHD) settings
  focusModeEnabled: boolean;
  showParkingLot: boolean;
  visualTimersEnabled: boolean;
  gamificationEnabled: boolean;

  // Clarity (Dyslexia) settings
  readingRulerEnabled: boolean;
  bionicReadingEnabled: boolean;
  largeHitAreas: boolean;

  // Calm (Anxiety/OCD) settings
  hideNotificationBadges: boolean;
  softErrorsEnabled: boolean;
  confirmDestructiveActions: boolean;
}

interface CognitiveProfileState {
  profile: CognitiveProfile;
  settings: ProfileSettings;
  setProfile: (profile: CognitiveProfile) => void;
  updateSettings: (settings: Partial<ProfileSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: ProfileSettings = {
  // Laser Focus defaults
  focusModeEnabled: false,
  showParkingLot: false,
  visualTimersEnabled: false,
  gamificationEnabled: false,

  // Clarity defaults
  readingRulerEnabled: false,
  bionicReadingEnabled: false,
  largeHitAreas: false,

  // Calm defaults
  hideNotificationBadges: false,
  softErrorsEnabled: false,
  confirmDestructiveActions: false,
};

const laserFocusSettings: ProfileSettings = {
  ...defaultSettings,
  focusModeEnabled: true,
  showParkingLot: true,
  visualTimersEnabled: true,
  gamificationEnabled: true,
};

const claritySettings: ProfileSettings = {
  ...defaultSettings,
  readingRulerEnabled: true,
  bionicReadingEnabled: false, // Optional, can be toggled
  largeHitAreas: true,
};

const calmSettings: ProfileSettings = {
  ...defaultSettings,
  hideNotificationBadges: true,
  softErrorsEnabled: true,
  confirmDestructiveActions: true,
};

function getProfileSettings(profile: CognitiveProfile): ProfileSettings {
  switch (profile) {
    case 'laser-focus':
      return laserFocusSettings;
    case 'clarity':
      return claritySettings;
    case 'calm':
      return calmSettings;
    default:
      return defaultSettings;
  }
}

export const useCognitiveProfileStore = create<CognitiveProfileState>()(
  persist(
    (set) => ({
      profile: 'default',
      settings: defaultSettings,

      setProfile: (profile) => {
        const newSettings = getProfileSettings(profile);
        set({ profile, settings: newSettings });

        // Apply CSS class to document root
        document.documentElement.className = document.documentElement.className
          .replace(/cognitive-profile-\S+/g, '')
          .trim();
        if (profile !== 'default') {
          document.documentElement.classList.add(`cognitive-profile-${profile}`);
        }
      },

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set((state) => ({
          settings: getProfileSettings(state.profile),
        })),
    }),
    {
      name: 'phm-cognitive-profile',
      onRehydrateStorage: () => (state) => {
        // Reapply CSS class on page load
        if (state?.profile && state.profile !== 'default') {
          document.documentElement.classList.add(`cognitive-profile-${state.profile}`);
        }
      },
    }
  )
);
