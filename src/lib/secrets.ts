/**
 * Single source of truth for the app's signing secrets.
 *
 * Deliberately free of Node built-ins so the edge proxy can import it too —
 * previously `src/proxy.ts` carried its own copy of the default secret with
 * no production guard, which meant the one file that decides who reaches /admin
 * was also the one file that would happily run on a known key.
 */

function requireSecret(name: string, devFallback: string): string {
  const value = process.env[name];

  if (process.env.NODE_ENV === "production") {
    if (!value || value === devFallback) {
      throw new Error(`${name} env var must be set to a unique random value in production.`);
    }
    if (value.length < 32) {
      throw new Error(`${name} is too short — use at least 32 characters (openssl rand -base64 32).`);
    }
  }

  return value || devFallback;
}

export const AUTH_SECRET = requireSecret("AUTH_SECRET", "bagulin-auth-dev-change-me-in-prod");
export const QR_SECRET = requireSecret("QR_SIGNING_SECRET", "bagulin-qr-dev-change-me-in-prod");
