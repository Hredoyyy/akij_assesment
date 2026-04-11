"use client";

import { ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import type { CandidateDashboardPaginationProps } from "@/types/candidate/components";

export function CandidateDashboardPagination({
  page,
  totalPages,
  pageSize,
  onPrevPage,
  onNextPage,
}: CandidateDashboardPaginationProps) {
  return (
    <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={onPrevPage}
          disabled={page === 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#F1F2F4] bg-white text-[#A0AEC0] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="inline-flex h-8 min-w-8 items-center justify-center rounded-[10px] bg-[#F8F8F8] px-[15px] text-xs font-semibold text-[#2E2E2F]">
          {page}
        </div>

        <button
          type="button"
          onClick={onNextPage}
          disabled={page === totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#F1F2F4] bg-white text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 self-end sm:self-auto">
        <p className="text-xs font-medium leading-[160%] text-[#666666]">Online Test Per Page</p>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#F1F2F4] bg-white px-3 text-xs font-medium text-[#2E2E2F]"
        >
          {pageSize}
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}