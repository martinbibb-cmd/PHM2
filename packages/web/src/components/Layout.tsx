import { ReactNode } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { useCognitiveProfileStore } from '../stores/cognitiveProfileStore';
import { Button } from './ui/button';
import { ParkingLot } from './cognitive/ParkingLot';
import { ReadingRuler } from './cognitive/ReadingRuler';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Brain,
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/leads', icon: UserPlus, label: 'Leads' },
  { to: '/visits', icon: Calendar, label: 'Visits' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, clearUser } = useAuthStore();
  const { profile, settings } = useCognitiveProfileStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearUser();
    window.location.href = '/';
  };

  // Don't render layout on login page
  if (location.pathname === '/' || location.pathname.startsWith('/view/')) {
    return <>{children}</>;
  }

  const shouldHideNav = settings.focusModeEnabled;

  return (
    <div className="min-h-screen bg-background">
      {/* Cognitive Profile Components */}
      <ParkingLot />
      <ReadingRuler />

      {/* Navigation */}
      {!shouldHideNav && (
        <>
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">P</span>
                </div>
                <div>
                  <h1 className="font-bold text-lg">PHM2</h1>
                  <p className="text-xs text-muted-foreground">Hail Mary</p>
                </div>
              </div>

              {profile !== 'default' && (
                <div className="mt-3 flex items-center gap-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  <Brain className="h-3 w-3" />
                  <span className="capitalize">{profile.replace('-', ' ')}</span>
                </div>
              )}
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t">
              <div className="flex items-center gap-3 px-4 py-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </aside>

          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-30 bg-card border-b">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
                <h1 className="font-bold">PHM2</h1>
              </div>

              {profile !== 'default' && (
                <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  <Brain className="h-3 w-3" />
                  <span className="capitalize">{profile.replace('-', ' ')}</span>
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <nav className="border-t p-4 space-y-1 bg-card">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-foreground'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </nav>
            )}
          </header>
        </>
      )}

      {/* Main Content */}
      <main className={shouldHideNav ? '' : 'md:ml-64'}>
        {shouldHideNav && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => settings && useCognitiveProfileStore.getState().updateSettings({ focusModeEnabled: false })}
            >
              <X className="h-4 w-4 mr-2" />
              Exit Focus Mode
            </Button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
