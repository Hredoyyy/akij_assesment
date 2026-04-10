"use client";

import Image from "next/image";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DashboardSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

export function DashboardSearchBar({
  value,
  onChange,
  placeholder = "Search by exam title",
  className,
  inputClassName,
}: DashboardSearchBarProps) {
  return (
    <div
      className={cn(
        "flex h-12 w-full items-center justify-between rounded-lg bg-white px-3 py-2 shadow-[2px_2px_6px_rgba(73,123,241,0.24)] lg:w-[621px]",
        className,
      )}
    >
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-8 border-0 px-0 text-xs font-normal leading-[15px] text-slate-700 shadow-none placeholder:text-[#7C8493]/50 focus-visible:ring-0",
          inputClassName,
        )}
      />
      <button
        type="button"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center"
        aria-label="Search"
      >
        <Image src="/search_button.svg" alt="Search" width={32} height={32} />
      </button>
    </div>
  );
}