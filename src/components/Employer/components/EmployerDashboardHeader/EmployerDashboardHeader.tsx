"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EmployerDashboardHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function EmployerDashboardHeader({ search, onSearchChange }: EmployerDashboardHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold leading-[130%] text-slate-700">Online Tests</h2>

      <div className="flex w-full flex-wrap items-center justify-end gap-3 lg:w-auto">
        <div className="w-full max-w-xl rounded-lg bg-white p-1 shadow-[2px_2px_6px_rgba(73,123,241,0.24)] lg:w-[621px]">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by exam title"
            className="h-10 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <Button asChild variant="outline" className="h-12 rounded-xl border-primary px-6 font-semibold text-primary">
          <Link href="/candidate/dashboard">Switch Dashboard</Link>
        </Button>
        <Button asChild className="h-12 rounded-xl px-8 font-semibold">
          <Link href="/employer/tests/new">Add New Test</Link>
        </Button>
      </div>
    </header>
  );
}
