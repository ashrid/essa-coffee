import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Admin auth middleware — populated in Plan 06 after Auth.js setup
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
