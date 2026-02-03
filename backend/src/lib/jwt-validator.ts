import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from '../config/index.js';

// EntraID JWT payload interface
export interface JwtPayload {
  oid: string; // Object ID (user ID)
  email?: string;
  preferred_username?: string;
  name?: string;
  groups?: string[]; // Group IDs for role-based access
}

// Create JWKS client for EntraID key retrieval
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${config.auth.tenantId}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

// Get signing key from JWKS
function getKey(
  header: jwt.JwtHeader,
  callback: (err: Error | null, key?: string) => void
): void {
  if (!header.kid) {
    callback(new Error('No key ID in token header'));
    return;
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Validate EntraID JWT token
export async function validateToken(token: string): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: config.auth.clientId,
        issuer: `https://login.microsoftonline.com/${config.auth.tenantId}/v2.0`,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(decoded as JwtPayload);
      }
    );
  });
}
