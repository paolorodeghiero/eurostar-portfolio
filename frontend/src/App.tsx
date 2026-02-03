import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { AuthProvider } from './components/AuthProvider';
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

function AppContent() {

  return (
    <div className="min-h-screen bg-eurostar-light">
      {/* Header */}
      <header className="bg-eurostar-teal px-6 py-4 flex justify-between items-center">
        <h1 className="text-eurostar-cream text-xl font-semibold">
          Eurostar Portfolio
        </h1>
        <AuthenticatedTemplate>
          <UserMenu />
        </AuthenticatedTemplate>
      </header>

      {/* Content */}
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
      </AuthenticatedTemplate>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
