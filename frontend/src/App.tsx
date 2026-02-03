import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { AuthProvider } from './components/AuthProvider';
import { LoginButton } from './components/LoginButton';
import { UserMenu } from './components/UserMenu';
import { useEffect, useState } from 'react';
import { apiClient } from './lib/api-client';

function AppContent() {
  const { accounts } = useMsal();
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accounts.length > 0) {
      apiClient<{ id: string; email: string; role: string }>('/api/me')
        .then(setUser)
        .catch((err) => setError(err.message));
    }
  }, [accounts]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F3EE' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#006B6B',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ color: '#E8E4D9', margin: 0, fontSize: '24px' }}>
          Eurostar Portfolio
        </h1>
        <AuthenticatedTemplate>
          <UserMenu />
        </AuthenticatedTemplate>
      </header>

      {/* Content */}
      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <UnauthenticatedTemplate>
          <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <h2 style={{ color: '#333', marginBottom: '24px' }}>
              Welcome to Eurostar Portfolio
            </h2>
            <p style={{ color: '#666', marginBottom: '32px' }}>
              Sign in to access the IT project portfolio management tool.
            </p>
            <LoginButton />
          </div>
        </UnauthenticatedTemplate>

        <AuthenticatedTemplate>
          <div>
            <h2 style={{ color: '#333' }}>Dashboard</h2>
            {error && (
              <p style={{ color: 'red' }}>Error: {error}</p>
            )}
            {user && (
              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Current User</h3>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </div>
            )}
          </div>
        </AuthenticatedTemplate>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
