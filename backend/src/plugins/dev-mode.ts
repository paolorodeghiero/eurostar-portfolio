// Development mode user for local testing
export function getDevUser() {
  return {
    id: 'dev-user',
    email: 'dev@eurostar.com',
    name: 'Development User',
    role: 'admin' as const, // Full access in dev mode
  };
}
