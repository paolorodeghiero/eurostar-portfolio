import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { msalInstance, msalInitPromise } from './lib/auth-config';

async function startApp() {
  // Wait for MSAL initialization
  await msalInitPromise;

  // Handle redirect response (if returning from login)
  try {
    const response = await msalInstance.handleRedirectPromise();
    if (response) {
      console.log('Redirect handled, account:', response.account?.username);
      msalInstance.setActiveAccount(response.account);
    }
  } catch (error) {
    console.error('Auth redirect error:', error);
    // Clear any bad state from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('msal.')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Set active account if available
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  // Render app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

startApp();
