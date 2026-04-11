"use client";

import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CandidateDashboardHeader } from "@/components/Candidate/components/CandidateDashboardHeader/CandidateDashboardHeader";
import { CandidateDashboardPagination } from "@/components/Candidate/components/CandidateDashboardPagination/CandidateDashboardPagination";
import { CandidateExamCard } from "@/components/Candidate/components/CandidateExamCard/CandidateExamCard";
import { ExamStartPolicyDialog } from "@/components/Candidate/components/ExamStartPolicyDialog/ExamStartPolicyDialog";
import { EmptyExamListState } from "@/components/Employer/components/EmptyExamListState/EmptyExamListState";
import type { CandidateAvailableExam } from "@/types/candidate/dashboard";
import type { CandidateExamListProps, StartAttemptResponse } from "@/types/candidate/examList";

export function CandidateExamList({ exams }: CandidateExamListProps) {
  const router = useRouter();
  const [startingExamId, setStartingExamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingExam, setPendingExam] = useState<CandidateAvailableExam | null>(null);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [initialTimestamp] = useState(() => Date.now());

  const pageSize = 8;

  const filteredExams = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return exams;
    }

    return exams.filter((exam) => exam.title.toLowerCase().includes(normalizedSearchTerm));
  }, [exams, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedExams = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredExams.slice(startIndex, startIndex + pageSize);
  }, [filteredExams, page, pageSize]);

  const hasNoExams = exams.length === 0;
  const hasNoSearchResults = exams.length > 0 && filteredExams.length === 0;

  const openTermsDialog = (examId: string) => {
    const exam = exams.find((entry) => entry.examId === examId) ?? null;

    if (!exam) {
      return;
    }

    setPendingExam(exam);
    setIsTermsDialogOpen(true);
  };

  const startExam = async (examId: string) => {
    try {
      setError(null);
      setStartingExamId(examId);

      const response = await axios.post<StartAttemptResponse>("/api/candidate/attempts/start", {
        examId,
      });

      router.push(`/candidate/attempts/${response.data.data.attemptId}`);
    } catch (requestError) {
      if (requestError instanceof AxiosError) {
        setError(requestError.response?.data?.error ?? "Unable to start exam.");
      } else {
        setError("Unable to start exam.");
      }
    } finally {
      setStartingExamId(null);
    }
  };

  const startExamAfterTerms = async () => {
    if (!pendingExam) {
      return;
    }

    setIsTermsDialogOpen(false);
    await startExam(pendingExam.examId);
    setPendingExam(null);
  };

  return (
    <section className="flex flex-col gap-4">
      <CandidateDashboardHeader search={searchTerm} onSearchChange={setSearchTerm} />

      {hasNoExams ? (
        <EmptyExamListState
          title="No Online Tests Yet"
          description="No exams are available right now. Please check again later for upcoming assessments."
        />
      ) : hasNoSearchResults ? (
        <EmptyExamListState
          title="No Matching Exams Found"
          description="Try changing your search keyword or clear the search field to see all available tests."
        />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            {paginatedExams.map((exam) => {
              return (
                <CandidateExamCard
                  key={`${exam.examId}-${exam.slotNumber}`}
                  exam={exam}
                  startingExamId={startingExamId}
                  currentTimestamp={initialTimestamp}
                  onStartExam={(examId) => {
                    openTermsDialog(examId);
                  }}
                />
              );
            })}
          </div>

          <CandidateDashboardPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
            onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          />
        </>
      )}

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <ExamStartPolicyDialog
        open={isTermsDialogOpen}
        examTitle={pendingExam?.title ?? null}
        isStarting={Boolean(pendingExam && startingExamId === pendingExam.examId)}
        onOpenChange={(open) => {
          setIsTermsDialogOpen(open);
          if (!open) {
            setPendingExam(null);
          }
        }}
        onCancel={() => {
          setIsTermsDialogOpen(false);
          setPendingExam(null);
        }}
        onConfirm={() => {
          void startExamAfterTerms();
        }}
      />
    </section>
  );
}
