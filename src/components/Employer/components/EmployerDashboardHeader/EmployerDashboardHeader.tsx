"use client";

import Link from "next/link";

import { DashboardSearchBar } from "@/components/Shared/DashboardSearchBar/DashboardSearchBar";
import { Button } from "@/components/ui/button";
import type { EmployerDashboardHeaderProps } from "@/types/employer/components";

export function EmployerDashboardHeader({ search, onSearchChange }: EmployerDashboardHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold leading-[130%] text-slate-700">Online Tests</h2>

      <div className="flex w-full flex-wrap items-center justify-end gap-3 lg:w-auto">
        <DashboardSearchBar value={search} onChange={onSearchChange} className="lg:mr-30"/>
        <Button asChild className="h-12 rounded-xl px-8 font-semibold">
          <Link href="/employer/tests/new">Add New Test</Link>
        </Button>
      </div>
    </header>
  );
}
