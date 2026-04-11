"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toClampedScore, toSubmissionMethodLabel } from "@/lib/employer/candidateRanking";
import { sanitizeRichTextHtml } from "@/lib/richText";
import type {
  CandidateFilter,
  CandidateRankingDialogProps,
  CandidateRow,
  FetchTextAnswersResponse,
  GradeTextAnswersResponse,
  GradingQuestion,
} from "@/types/employer/candidateRanking";

export function CandidateRankingDialog({ examId, examTitle, candidates }: CandidateRankingDialogProps) {
  const [filter, setFilter] = useState<CandidateFilter>("ALL");
  const [candidateRows, setCandidateRows] = useState<CandidateRow[]>(candidates);
  const [gradingTarget, setGradingTarget] = useState<CandidateRow | null>(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [isLoadingTextAnswers, setIsLoadingTextAnswers] = useState(false);
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});
  const [gradingQuestions, setGradingQuestions] = useState<GradingQuestion[]>([]);

  useEffect(() => {
    setCandidateRows(candidates);
  }, [candidates]);

  const rankedCandidates = useMemo(
    () =>
      [...candidateRows].sort(
        (a, b) => (b.score ?? Number.NEGATIVE_INFINITY) - (a.score ?? Number.NEGATIVE_INFINITY),
      ),
    [candidateRows],
  );

  const filteredCandidates = useMemo(() => {
    if (filter === "ALL") {
      return rankedCandidates;
    }

    if (filter === "GRADED") {
      return rankedCandidates.filter((candidate) => candidate.isTextGraded);
    }

    return rankedCandidates.filter((candidate) => candidate.requiresTextGrading && !candidate.isTextGraded);
  }, [filter, rankedCandidates]);

  const openGradingDialog = async (candidate: CandidateRow) => {
    setGradingError(null);
    setIsLoadingTextAnswers(true);
    setGradingTarget(candidate);
    setIsGradeDialogOpen(true);

    try {
      const response = await axios.get<FetchTextAnswersResponse>(
        `/api/exams/${examId}/attempts/${candidate.attemptId}/text-grading`,
      );

      setGradingQuestions(response.data.data.textAnswers);
      setGradeInputs(
        response.data.data.textAnswers.reduce<Record<string, string>>((acc, question) => {
          acc[question.answerId] = String(question.awardedPoints);
          return acc;
        }, {}),
      );
    } catch {
      setGradingError("Unable to load text answers for grading right now.");
      setGradingQuestions([]);
      setGradeInputs({});
    } finally {
      setIsLoadingTextAnswers(false);
    }
  };

  const submitGrades = async () => {
    if (!gradingTarget) {
      return;
    }

    setGradingError(null);
    setIsSavingGrades(true);

    try {
      const grades = gradingQuestions.map((question) => ({
        answerId: question.answerId,
        awardedPoints: toClampedScore(gradeInputs[question.answerId] ?? "0", question.maxPoints),
      }));

      const response = await axios.post<GradeTextAnswersResponse>(
        `/api/exams/${examId}/attempts/${gradingTarget.attemptId}/text-grading`,
        { grades },
      );

      setCandidateRows((prev) =>
        prev.map((candidate) =>
          candidate.attemptId === gradingTarget.attemptId
            ? {
                ...candidate,
                score: response.data.data.score,
                isTextGraded: true,
              }
            : candidate,
        ),
      );

      setIsGradeDialogOpen(false);
    } catch {
      setGradingError("Unable to save graded scores right now.");
    } finally {
      setIsSavingGrades(false);
    }
  };

  return (
    <>
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-12 rounded-xl border-primary px-6 font-semibold text-primary">
          View Candidates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl rounded-2xl border border-slate-200 p-0">
        <DialogHeader>
          <div className="border-b border-slate-200 px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-slate-700">{examTitle} - Candidate Scores</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-slate-500">
              Ranked from highest to lowest score. You can review violations, submission method, and grade text answers.
            </DialogDescription>
          </div>
        </DialogHeader>

        {rankedCandidates.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-slate-600">No submitted candidate attempts yet.</p>
        ) : (
          <div className="px-6 pb-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={filter === "ALL" ? "default" : "outline"}
                className="rounded-lg"
                onClick={() => setFilter("ALL")}
              >
                All ({rankedCandidates.length})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filter === "GRADED" ? "default" : "outline"}
                className="rounded-lg"
                onClick={() => setFilter("GRADED")}
              >
                Graded ({rankedCandidates.filter((candidate) => candidate.isTextGraded).length})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filter === "UNGRADED" ? "default" : "outline"}
                className="rounded-lg"
                onClick={() => setFilter("UNGRADED")}
              >
                Ungraded ({rankedCandidates.filter((candidate) => candidate.requiresTextGrading && !candidate.isTextGraded).length})
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 bg-white">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Violations</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Submission Method</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((candidate, index) => (
                    <tr key={candidate.attemptId}>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">#{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{candidate.candidateName}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{candidate.score ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{candidate.violations}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{toSubmissionMethodLabel(candidate.status)}</td>
                      <td className="px-4 py-3">
                        {!candidate.requiresTextGrading ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-slate-300 text-slate-500"
                            disabled
                          >
                            No Text Answers
                          </Button>
                        ) : candidate.isTextGraded ? (
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-600"
                            disabled
                          >
                            <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                            Graded
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-primary/30 text-primary"
                            onClick={() => {
                              void openGradingDialog(candidate);
                            }}
                          >
                            Grade Text Answers
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCandidates.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No candidates found for this filter.</p>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>

    <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
      <DialogContent className="max-w-4xl rounded-2xl border border-slate-200 p-0">
        <DialogHeader>
          <div className="border-b border-slate-200 px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-slate-700">
              Grade Text Answers{gradingTarget ? ` - ${gradingTarget.candidateName}` : ""}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-slate-500">
              Enter awarded points for each text response. These points are added to the candidate&apos;s total score.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
          {isLoadingTextAnswers ? (
            <p className="text-sm text-slate-600">Loading text answers...</p>
          ) : gradingQuestions.length === 0 ? (
            <p className="text-sm text-slate-600">No text answers found for this attempt.</p>
          ) : (
            gradingQuestions.map((question, index) => (
              <article key={question.answerId} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800">Question {index + 1}</h3>
                    <div
                      className="candidate-rich-text mt-1 text-sm text-slate-700"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(question.questionTitle) }}
                    />
                    <div
                      className="candidate-rich-text mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(question.textAnswer) }}
                    />
                  </div>

                  <div className="w-[160px]">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Awarded Points
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={question.maxPoints}
                      step="0.25"
                      value={gradeInputs[question.answerId] ?? "0"}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setGradeInputs((prev) => ({
                          ...prev,
                          [question.answerId]: nextValue,
                        }));
                      }}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-700 outline-none ring-primary/20 focus:ring"
                    />
                    <p className="mt-1 text-xs text-slate-500">Max {question.maxPoints} points</p>
                  </div>
                </div>
              </article>
            ))
          )}

          {gradingError ? <p className="text-sm text-rose-600">{gradingError}</p> : null}
        </div>

        <DialogFooter className="border-t border-slate-200 px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-xl border-slate-300">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            className="rounded-xl"
            disabled={isLoadingTextAnswers || isSavingGrades || gradingQuestions.length === 0}
            onClick={() => {
              void submitGrades();
            }}
          >
            {isSavingGrades ? "Saving Grades..." : "Save Grades"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
