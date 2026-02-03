import { ReactNode, useEffect } from 'react';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { msalInstance } from '../lib/auth-config';

// Component to handle account initialization on refresh
function MsalAccountInitializer({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal();

  useEffect(() => {
    // Restore active account from localStorage cache
    if (accounts.length > 0 && !instance.getActiveAccount()) {
      instance.setActiveAccount(accounts[0]);
    }
  }, [instance, accounts]);

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
