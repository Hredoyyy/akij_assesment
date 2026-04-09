"use client";

import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type AvailableExam = {
  examId: string;
  title: string;
  duration: number;
  slotNumber: number;
  slotStartTime: string;
  slotEndTime: string;
  attemptStatus: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED" | null;
};

type CandidateExamListProps = {
  exams: AvailableExam[];
};

type StartAttemptResponse = {
  success: true;
  data: {
    attemptId: string;
  };
};

export function CandidateExamList({ exams }: CandidateExamListProps) {
  const router = useRouter();
  const [startingExamId, setStartingExamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Available Exams</h2>

      {exams.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No active exams are available right now.</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {exams.map((exam) => {
            const isUpcoming = new Date(exam.slotStartTime).getTime() > Date.now();
            const isCompleted =
              exam.attemptStatus === "SUBMITTED" ||
              exam.attemptStatus === "TIMED_OUT" ||
              exam.attemptStatus === "VIOLATION_TERMINATED";

            return (
              <article key={`${exam.examId}-${exam.slotNumber}`} className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-base font-semibold text-slate-900">{exam.title}</h3>
                <p className="mt-1 text-xs text-slate-500">Slot {exam.slotNumber}</p>
                <p className="mt-2 text-sm text-slate-600">Duration: {exam.duration} minutes</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(exam.slotStartTime).toLocaleString()} - {new Date(exam.slotEndTime).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {isUpcoming ? "Status: Upcoming" : "Status: Active"}
                </p>

                <div className="mt-4">
                  <Button
                    disabled={isCompleted || isUpcoming || startingExamId === exam.examId}
                    onClick={() => startExam(exam.examId)}
                  >
                    {startingExamId === exam.examId
                      ? "Starting..."
                      : isCompleted
                        ? "Attempt Completed"
                        : isUpcoming
                          ? "Not Started Yet"
                        : exam.attemptStatus === "IN_PROGRESS"
                          ? "Resume Attempt"
                          : "Start Exam"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}
