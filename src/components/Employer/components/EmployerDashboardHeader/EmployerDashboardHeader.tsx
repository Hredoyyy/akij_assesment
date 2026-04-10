"use client";

import Image from "next/image";
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
        <div className="flex h-12 w-full items-center justify-between rounded-lg bg-white px-3 py-2 shadow-[2px_2px_6px_rgba(73,123,241,0.24)] lg:w-[621px]">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by exam title"
            className="h-8 border-0 px-0 text-xs font-normal leading-[15px] text-slate-700 shadow-none placeholder:text-[#7C8493]/50 focus-visible:ring-0"
          />
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center"
            aria-label="Search"
          >
            <Image src="/search_button.svg" alt="Search" width={32} height={32} />
          </button>
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
