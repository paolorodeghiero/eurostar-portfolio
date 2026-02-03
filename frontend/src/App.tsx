import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { AuthProvider } from './components/AuthProvider';
import { DevAuthProvider, useDevAuth } from './components/DevAuthProvider';
import { LoginButton } from './components/LoginButton';
import { UserMenu } from './components/UserMenu';
import { AdminLayout } from './pages/admin/AdminLayout';
import { ReferentialList } from './pages/admin/ReferentialList';
import { DepartmentsPage } from './pages/admin/DepartmentsPage';
import { TeamsPage } from './pages/admin/TeamsPage';
import { StatusesPage } from './pages/admin/StatusesPage';
import { OutcomesPage } from './pages/admin/OutcomesPage';
import { CostCentersPage } from './pages/admin/CostCentersPage';
import { CurrencyRatesPage } from './pages/admin/CurrencyRatesPage';
import { CommitteeThresholdsPage } from './pages/admin/CommitteeThresholdsPage';
import { CostTshirtThresholdsPage } from './pages/admin/CostTshirtThresholdsPage';
import { CompetenceMonthPatternsPage } from './pages/admin/CompetenceMonthPatternsPage';

// Dev mode user menu (simpler than MSAL version)
function DevUserMenu() {
  const { devUser } = useDevAuth();

  if (!devUser) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-eurostar-cream text-sm">
        {devUser.name || devUser.email}
      </span>
      <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-medium rounded">
        DEV MODE
      </span>
    </div>
  );
}

// Admin routes (shared between dev mode and production)
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<ReferentialList />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="statuses" element={<StatusesPage />} />
        <Route path="outcomes" element={<OutcomesPage />} />
        <Route path="cost-centers" element={<CostCentersPage />} />
        <Route path="currency-rates" element={<CurrencyRatesPage />} />
        <Route path="committee-thresholds" element={<CommitteeThresholdsPage />} />
        <Route path="cost-tshirt-thresholds" element={<CostTshirtThresholdsPage />} />
        <Route path="competence-month-patterns" element={<CompetenceMonthPatternsPage />} />
      </Route>
    </Routes>
  );
}

// Loading spinner
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-eurostar-light flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eurostar-teal mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Main app content with dev mode detection
function AppContent() {
  const { isDevMode, isLoading } = useDevAuth();

  // Show loading while checking for dev mode
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Dev mode: bypass MSAL entirely
  if (isDevMode) {
    return (
      <div className="min-h-screen bg-eurostar-light">
        <header className="bg-eurostar-teal px-6 py-4 flex justify-between items-center">
          <h1 className="text-eurostar-cream text-xl font-semibold">
            Eurostar Portfolio
          </h1>
          <DevUserMenu />
        </header>
        <AdminRoutes />
      </div>
    );
  }

  // Production mode: use MSAL authentication
  return (
    <AuthProvider>
      <div className="min-h-screen bg-eurostar-light">
        <header className="bg-eurostar-teal px-6 py-4 flex justify-between items-center">
          <h1 className="text-eurostar-cream text-xl font-semibold">
            Eurostar Portfolio
          </h1>
          <AuthenticatedTemplate>
            <UserMenu />
          </AuthenticatedTemplate>
        </header>

        <UnauthenticatedTemplate>
          <main className="p-10 max-w-3xl mx-auto">
            <div className="text-center mt-20">
              <h2 className="text-2xl text-gray-900 mb-6">
                Welcome to Eurostar Portfolio
              </h2>
              <p className="text-gray-600 mb-8">
                Sign in to access the IT project portfolio management tool.
              </p>
              <LoginButton />
            </div>
          </main>
        </UnauthenticatedTemplate>

        <AuthenticatedTemplate>
          <AdminRoutes />
        </AuthenticatedTemplate>
      </div>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DevAuthProvider>
        <AppContent />
      </DevAuthProvider>
    </BrowserRouter>
  );
}
