import { useMsal } from '@azure/msal-react';

export function UserMenu() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const handleLogout = async () => {
    await instance.logoutPopup();
  };

  if (!account) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ color: '#E8E4D9' }}>
        {account.name || account.username}
      </span>
      <button
        onClick={handleLogout}
        style={{
          padding: '8px 16px',
          backgroundColor: 'transparent',
          color: '#E8E4D9',
          border: '1px solid #E8E4D9',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </div>
  );
}
