import { ReactNode, useEffect, useState } from 'react';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance, loginRequest } from '../lib/auth-config';

// Helper to clear MSAL localStorage cache
function clearMsalCache() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('msal.') || key.includes('.msal.')) {
      localStorage.removeItem(key);
    }
  });
}

// Component to handle account initialization and token validation on refresh
function MsalAccountInitializer({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    async function validateSession() {
      // If no accounts, nothing to validate
      if (accounts.length === 0) {
        setIsValidating(false);
        return;
      }

      const account = accounts[0];

      // Try to acquire token silently to validate the session is still good
      try {
        await instance.acquireTokenSilent({
          ...loginRequest,
          account,
        });
        // Token is valid, set as active account
        instance.setActiveAccount(account);
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          // Token expired but can be refreshed via interaction - leave account, let user re-auth
          console.warn('Session expired, user will need to re-authenticate');
          instance.setActiveAccount(account);
        } else {
          // Token is invalid or other error - clear stale cache
          console.warn('Invalid session, clearing cached accounts');
          clearMsalCache();
          // Force MSAL to re-read the (now empty) cache
          window.location.reload();
          return;
        }
      }

      setIsValidating(false);
    }

    validateSession();
  }, [instance, accounts]);

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen bg-eurostar-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eurostar-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <MsalProvider instance={msalInstance}>
      <MsalAccountInitializer>
        {children}
      </MsalAccountInitializer>
    </MsalProvider>
  );
}
