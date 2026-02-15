import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { AuthProvider } from './components/AuthProvider';
import { DevAuthProvider, useDevAuth } from './components/DevAuthProvider';
import { LoginButton } from './components/LoginButton';
import { AdminLayout } from './pages/admin/AdminLayout';
import { ReferentialList } from './pages/admin/ReferentialList';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { DepartmentsPage } from './pages/admin/DepartmentsPage';
import { TeamsPage } from './pages/admin/TeamsPage';
import { StatusesPage } from './pages/admin/StatusesPage';
import { OutcomesPage } from './pages/admin/OutcomesPage';
import { CostCentersPage } from './pages/admin/CostCentersPage';
import { CurrencyRatesPage } from './pages/admin/CurrencyRatesPage';
import { CommitteeLevelsPage } from './pages/admin/CommitteeLevelsPage';
import { CommitteeThresholdsPage } from './pages/admin/CommitteeThresholdsPage';
import { CostTshirtThresholdsPage } from './pages/admin/CostTshirtThresholdsPage';
import { CompetenceMonthPatternsPage } from './pages/admin/CompetenceMonthPatternsPage';
import { BudgetLinesPage } from './pages/admin/BudgetLinesPage';
import { PortfolioPage } from './pages/portfolio/PortfolioPage';


// App routes (shared between dev mode and production)
function AppRoutes() {
  return (
    <Routes>
      {/* Portfolio is the home page */}
      <Route path="/" element={<PortfolioPage />} />

      {/* Admin routes for referential data management */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<ReferentialList />} />
        <Route path="audit-log" element={<AuditLogPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="statuses" element={<StatusesPage />} />
        <Route path="outcomes" element={<OutcomesPage />} />
        <Route path="cost-centers" element={<CostCentersPage />} />
        <Route path="budget-lines" element={<BudgetLinesPage />} />
        <Route path="currency-rates" element={<CurrencyRatesPage />} />
        <Route path="committee-levels" element={<CommitteeLevelsPage />} />
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
        <AppRoutes />
      </div>
    );
  }

  // Production mode: use MSAL authentication
  return (
    <AuthProvider>
      <div className="min-h-screen bg-eurostar-light">
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
          <AppRoutes />
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
