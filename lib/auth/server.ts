import "server-only";

import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";

let authInstance: NeonAuth | undefined;

export function getMissingAuthEnvironment() {
  const missing: string[] = [];

  if (!process.env.NEON_AUTH_BASE_URL) {
    missing.push("NEON_AUTH_BASE_URL");
  }

  if (!process.env.NEON_AUTH_COOKIE_SECRET || process.env.NEON_AUTH_COOKIE_SECRET.length < 32) {
    missing.push("NEON_AUTH_COOKIE_SECRET");
  }

  return missing;
}

export function isAuthConfigured() {
  return getMissingAuthEnvironment().length === 0;
}

export function getAuth() {
  if (!isAuthConfigured()) {
    throw new Error("Managed Better Auth is not configured for this environment.");
  }

  authInstance ??= createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: {
      secret: process.env.NEON_AUTH_COOKIE_SECRET!,
      sessionDataTtl: 300,
    },
    logLevel: process.env.NODE_ENV === "development" ? "warn" : "error",
  });

  return authInstance;
}
