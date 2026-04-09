import type { UserRole } from "@/types/auth";

export function getDashboardPathByRole(role: UserRole): string {
  return role === "EMPLOYER" ? "/employer/dashboard" : "/candidate/dashboard";
}
