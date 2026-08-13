import type { NextRequest } from "next/server";

import { getAuth, isAuthConfigured } from "@/lib/auth/server";
import { isPublicSignUpOpen } from "@/lib/auth/policy";

type AuthRouteContext = {
  params: Promise<{ path: string[] }>;
};

function unavailable() {
  return Response.json(
    { error: "Authentication is not configured in this environment." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

function privateBetaOnly() {
  return Response.json(
    { error: "Public account creation is closed. Join the waitlist for access." },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: NextRequest, context: AuthRouteContext) {
  if (!isAuthConfigured()) {
    return unavailable();
  }

  return getAuth().handler().GET(request, context);
}

export async function POST(request: NextRequest, context: AuthRouteContext) {
  if (!isAuthConfigured()) {
    return unavailable();
  }

  const { path } = await context.params;
  const authPath = path.join("/");

  // Managed Better Auth does not yet provide a global invite-only switch.
  // Block every public sign-up and social entry point until the beta is open.
  if (!isPublicSignUpOpen() && (
    authPath.startsWith("sign-up") ||
    authPath === "sign-in/social"
  )) {
    return privateBetaOnly();
  }

  return getAuth().handler().POST(request, context);
}

export async function PUT(request: NextRequest, context: AuthRouteContext) {
  if (!isAuthConfigured()) return unavailable();
  return getAuth().handler().PUT(request, context);
}

export async function PATCH(request: NextRequest, context: AuthRouteContext) {
  if (!isAuthConfigured()) return unavailable();
  return getAuth().handler().PATCH(request, context);
}

export async function DELETE(request: NextRequest, context: AuthRouteContext) {
  if (!isAuthConfigured()) return unavailable();
  return getAuth().handler().DELETE(request, context);
}
