import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../lib/auth-config';

export function LoginButton() {
  const { instance, inProgress } = useMsal();

  const handleLogin = async () => {
    if (inProgress !== 'none') return; // Prevent duplicate logins

    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={inProgress !== 'none'}
      style={{
        padding: '12px 24px',
        backgroundColor: '#006B6B',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: inProgress !== 'none' ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        fontWeight: 500,
      }}
    >
      {inProgress !== 'none' ? 'Signing in...' : 'Sign in with Microsoft'}
    </button>
  );
}
