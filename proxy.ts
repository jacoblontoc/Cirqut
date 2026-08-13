import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAuth, isAuthConfigured } from "@/lib/auth/server";

export async function proxy(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?setup=required", request.url));
  }

  return getAuth().middleware({ loginUrl: "/login" })(request);
}

export const config = {
  matcher: ["/account/:path*"],
};
