"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type CandidateRankingDialogProps = {
  examTitle: string;
  candidates: Array<{
    candidateName: string;
    score: number | null;
  }>;
};

export function CandidateRankingDialog({ examTitle, candidates }: CandidateRankingDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-12 rounded-xl border-primary px-6 font-semibold text-primary">
          View Candidates
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{examTitle} - Candidate Scores</DialogTitle>
          <DialogDescription>Ranked from highest to lowest score.</DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <p className="text-sm text-slate-600">No submitted candidate attempts yet.</p>
        ) : (
          <div className="space-y-2">
            {candidates.map((candidate, index) => (
              <div
                key={`${candidate.candidateName}-${index}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
              >
                <p className="text-sm font-medium text-slate-800">
                  {index + 1}. {candidate.candidateName}
                </p>
                <p className="text-sm text-slate-600">{candidate.score ?? 0}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
