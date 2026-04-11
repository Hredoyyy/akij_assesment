import type { AttemptStatus } from "@/types/employer/candidateRanking";

export const toSubmissionMethodLabel = (status: AttemptStatus) => {
  if (status === "SUBMITTED") {
    return "Manual Submit";
  }

  if (status === "TIMED_OUT") {
    return "Timeout";
  }

  if (status === "VIOLATION_TERMINATED") {
    return "Violation";
  }

  return "In Progress";
};

export const toClampedScore = (value: string, maxPoints: number) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(maxPoints, parsed));
};
