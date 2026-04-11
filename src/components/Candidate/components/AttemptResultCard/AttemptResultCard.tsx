"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { AttemptResultCardProps } from "@/types/candidate/components";

export function AttemptResultCard({
  examTitle,
  candidateDisplayName,
  onBackToDashboard,
}: AttemptResultCardProps) {
  return (
    <section className="mx-auto mt-16 w-full max-w-[1280px] rounded-[20px] border border-[#E5E7EB] bg-white px-6 py-14 sm:px-10">
      <div className="mx-auto flex max-w-[970px] flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <Image src="/complete.svg" alt="Completed" width={56} height={56} />
          <h2 className="text-[20px] font-semibold leading-6 text-slate-700">Test Completed</h2>
          <p className="text-base font-normal leading-[19px] text-slate-500">
            Congratulations! {candidateDisplayName}, you have completed your exam for {examTitle}.
            Thank you for participating.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={onBackToDashboard}
          className="h-12 w-full rounded-xl border-[#E5E7EB] px-8 text-base font-semibold text-slate-700 sm:w-auto sm:min-w-[180px]"
        >
          Back to Dashboard
        </Button>
      </div>
    </section>
  );
}
