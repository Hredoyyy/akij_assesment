import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

export async function getCurrentUser() {
  const session = await getSession();
  return session.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
