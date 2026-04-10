"use client";

import { useRouter } from "next/navigation";

import { CandidateRankingDialog } from "@/components/Employer/components/CandidateRankingDialog/CandidateRankingDialog";
import type { EmployerExamSummary } from "@/components/Employer/components/EmployerDashboardTypes/EmployerDashboardTypes";

type EmployerExamCardProps = {
  exam: EmployerExamSummary;
};

export function EmployerExamCard({ exam }: EmployerExamCardProps) {
  const router = useRouter();
  const editHref = `/employer/tests/new?examId=${exam.id}&v=${new Date(exam.updatedAt).getTime()}`;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(editHref)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(editHref);
        }
      }}
      className="flex w-full max-w-[632px] cursor-pointer flex-col justify-center gap-6 rounded-2xl border border-slate-200 bg-white px-8 py-8"
    >
      <div className="space-y-4">
        <h3 className="text-xl font-semibold leading-[140%] text-slate-700">{exam.title}</h3>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm leading-[150%]">
          <p className="text-slate-500">
            Candidates: <span className="font-medium text-slate-700">{exam.totalCandidates}</span>
          </p>
          <p className="text-slate-500">
            Question Set: <span className="font-medium text-slate-700">{exam.totalQuestions}</span>
          </p>
          <p className="text-slate-500">
            Exam Slots: <span className="font-medium text-slate-700">{exam.totalSlots}</span>
          </p>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-3"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <CandidateRankingDialog
          examTitle={exam.title}
          candidates={exam.candidates.map((candidate) => ({
            candidateName: candidate.candidateName,
            score: candidate.score,
          }))}
        />
      </div>
    </article>
  );
}
