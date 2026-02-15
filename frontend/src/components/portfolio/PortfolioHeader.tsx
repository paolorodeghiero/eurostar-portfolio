import { Link, useLocation } from 'react-router-dom';
import { useAccount } from '@azure/msal-react';
import { Upload, Settings, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertsDropdown } from '@/components/AlertsDropdown';
import { useDevAuth } from '@/components/DevAuthProvider';

interface PortfolioHeaderProps {
  onUploadActuals?: () => void;
  onAlertClick?: (projectId: number) => void;
}

export function PortfolioHeader({ onUploadActuals, onAlertClick }: PortfolioHeaderProps) {
  const location = useLocation();
  const { isDevMode, devUser } = useDevAuth();

  // Get user info from MSAL or dev mode
  const account = useAccount();
  const userName = isDevMode ? devUser?.name : account?.name;
  const userEmail = isDevMode ? devUser?.email : account?.username;

  // Get initials from name or email
  const getInitials = (name: string | undefined, email: string | undefined): string => {
    if (name) {
      const parts = name.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const initials = getInitials(userName, userEmail);
  const isOnAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 bg-[#086264] px-4 py-3 shadow-md">
      <div className="flex items-center justify-between max-w-full">
        {/* Left: Logo and brand */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <img
              src="/eurostar-logo.png"
              alt="Eurostar"
              className="h-8"
            />
            <span className="text-[#F5F0E8] text-lg font-semibold tracking-tight">
              Project Portfolio
            </span>
          </Link>
        </div>

        {/* Right: Actions and user */}
        <div className="flex items-center gap-3">
          {/* Upload Actuals button */}
          {onUploadActuals && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-white/10"
              onClick={onUploadActuals}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Actuals
            </Button>
          )}

          {/* API Documentation link */}
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
          >
            <FileJson className="h-4 w-4" />
            API
          </a>

          {/* Admin link */}
          <Link
            to="/admin"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isOnAdmin
                ? 'bg-white/20 text-white'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings className="h-4 w-4" />
            Admin
          </Link>

          {/* Alerts dropdown - next to user */}
          <div className="text-white [&_button]:text-white [&_button]:hover:bg-white/10">
            <AlertsDropdown onAlertClick={onAlertClick} />
          </div>

          {/* User identity */}
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/20">
            {/* Initials circle */}
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-medium">
              {initials}
            </div>
            {/* Name */}
            <span className="text-white text-sm hidden sm:block max-w-[160px] truncate">
              {userName || userEmail || 'User'}
            </span>
            {/* Dev mode indicator */}
            {isDevMode && (
              <span className="px-1.5 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded">
                DEV
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
