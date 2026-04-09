import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import type { SessionData } from "@/types/auth";

const sessionPassword = process.env.SESSION_PASSWORD;

if (!sessionPassword || sessionPassword.length < 32) {
  throw new Error("SESSION_PASSWORD must be set and at least 32 characters.");
}

export const sessionOptions: SessionOptions = {
  cookieName: "assessment_session",
  password: sessionPassword,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
