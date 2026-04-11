"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";

type AttemptTerminationDialogProps = {
  status: "TIMED_OUT" | "VIOLATION_TERMINATED";
  examTitle: string;
  open: boolean;
  onBackToDashboard: () => void;
};

export function AttemptTerminationDialog({
  status,
  examTitle,
  open,
  onBackToDashboard,
}: AttemptTerminationDialogProps) {
  if (!open) {
    return null;
  }

  const isTimeout = status === "TIMED_OUT";
  const title = isTimeout ? "Timeout!" : "Exam Terminated";
  const description = isTimeout
    ? `Your exam time for ${examTitle} has finished. Thank you for participating.`
    : `Your attempt for ${examTitle} was submitted due to repeated violations.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(56,56,56,0.6)] px-4">
      <section className="w-full max-w-[791px] rounded-[20px] border border-[#E5E7EB] bg-white px-6 py-14 sm:px-10">
        <div className="mx-auto flex max-w-[674px] flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            {isTimeout ? (
              <Image src="/timeout.svg" alt="Timeout" width={56} height={56} />
            ) : (
              <Image src="/violation.svg" alt="Violation" width={56} height={56} />
            )}
            <h2 className="text-[20px] font-semibold leading-6 text-slate-700">{title}</h2>
            <p className="text-base font-normal leading-[19px] text-slate-500">{description}</p>
          </div>

          <Button
            variant="outline"
            onClick={onBackToDashboard}
            className="h-12 min-w-[180px] rounded-xl border-[#E5E7EB] px-8 text-base font-semibold text-slate-700"
          >
            Back to Dashboard
          </Button>
        </div>
      </section>
    </div>
  );
}
