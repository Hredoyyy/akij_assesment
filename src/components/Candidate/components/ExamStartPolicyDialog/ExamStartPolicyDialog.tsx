"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExamStartPolicyDialogProps } from "@/types/candidate/examList";

export function ExamStartPolicyDialog({
  open,
  examTitle,
  isStarting,
  onOpenChange,
  onCancel,
  onConfirm,
}: ExamStartPolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-800">Exam Rules & Violation Policy</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-slate-500">
            Please read carefully before starting {examTitle ? `"${examTitle}"` : "the exam"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-slate-700">
          <p>During the exam, behavior tracking is active. The system records violations when you:</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li>Switch tabs or apps.</li>
            <li>Leave fullscreen mode.</li>
            <li>Move focus away from the exam window.</li>
          </ul>
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 font-medium text-rose-700">
            3 violations will automatically terminate and submit your attempt.
          </p>
          <p className="text-slate-600">
            You will be prompted to continue in fullscreen mode when the exam begins.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-xl border-slate-300" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" className="rounded-xl" disabled={isStarting} onClick={onConfirm}>
            {isStarting ? "Starting..." : "I Understand, Start Exam"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
