import { unsealData } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";

import type { SessionData } from "@/types/auth";

const COOKIE_NAME = "assessment_session";

async function getSessionUser(request: NextRequest): Promise<SessionData["user"]> {
  const sealed = request.cookies.get(COOKIE_NAME)?.value;
  const password = process.env.SESSION_PASSWORD;

  if (!sealed || !password || password.length < 32) {
    return undefined;
  }

  try {
    const session = await unsealData<SessionData>(sealed, {
      password,
    });
    return session.user;
  } catch {
    return undefined;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isEmployerPath = pathname.startsWith("/employer");
  const isCandidatePath = pathname.startsWith("/candidate");

  if (!isEmployerPath && !isCandidatePath) {
    return NextResponse.next();
  }

  const user = await getSessionUser(request);

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isEmployerPath && user.role !== "EMPLOYER") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isCandidatePath && user.role !== "CANDIDATE") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/employer/:path*", "/candidate/:path*"],
};
