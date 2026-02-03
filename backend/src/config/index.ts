import 'dotenv/config';

// Check if running in development mode
const isDev = process.env.DEV_MODE === 'true';

// Validate required environment variables
function validateEnv(): void {
  const missing: string[] = [];

  // DATABASE_URL is always required
  if (!process.env.DATABASE_URL) {
    missing.push('DATABASE_URL');
  }

  // Auth vars required in production mode only
  if (!isDev) {
    if (!process.env.ENTRA_TENANT_ID) {
      missing.push('ENTRA_TENANT_ID');
    }
    if (!process.env.ENTRA_CLIENT_ID) {
      missing.push('ENTRA_CLIENT_ID');
    }
    if (!process.env.ADMIN_GROUP_ID) {
      missing.push('ADMIN_GROUP_ID');
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        (isDev ? '' : 'Set DEV_MODE=true to run without authentication.')
    );
  }
}

// Run validation at module load
validateEnv();

// Configuration object
export const config = Object.freeze({
  isDev,
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL!,
  },
  auth: {
    tenantId: process.env.ENTRA_TENANT_ID || '',
    clientId: process.env.ENTRA_CLIENT_ID || '',
    adminGroupId: process.env.ADMIN_GROUP_ID || '',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
});
