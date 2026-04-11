"use client";

import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { usePathname } from "next/navigation";

import type { UserRole } from "@/types/auth";

type DashboardRoleSwitcherProps = {
  role: UserRole;
};

export function DashboardRoleSwitcher({ role }: DashboardRoleSwitcherProps) {
  const pathname = usePathname();

  if (role !== "EMPLOYER") {
    return null;
  }

  const isEmployerView = pathname.startsWith("/employer");
  const targetHref = isEmployerView ? "/candidate/dashboard" : "/employer/dashboard";
  const tooltipLabel = isEmployerView
    ? "Switch to candidate dashboard"
    : "Switch to employer dashboard";

  return (
    <Link
      href={targetHref}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:-translate-y-px hover:border-primary hover:text-primary"
      aria-label={tooltipLabel}
      title={tooltipLabel}
    >
        <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
