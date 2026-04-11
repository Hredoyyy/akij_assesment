"use client";

import { DashboardSearchBar } from "@/components/Shared/DashboardSearchBar/DashboardSearchBar";

type CandidateDashboardHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function CandidateDashboardHeader({ search, onSearchChange }: CandidateDashboardHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold leading-[130%] text-slate-700">Online Tests</h2>

      <div className="flex w-full items-center justify-end lg:w-auto">
        <DashboardSearchBar
          value={search}
          onChange={onSearchChange}
          className="border border-[#E5E7EB] lg:mr-30"
          inputClassName="text-[#7C8493]"
        />
      </div>
    </header>
  );
}