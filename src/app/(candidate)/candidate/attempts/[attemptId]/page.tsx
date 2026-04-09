import { redirect } from "next/navigation";

import { fetchAttemptRuntimeAction } from "@/actions/Candidate/fetchAttemptRuntime/logic";
import { fetchAttemptRuntimeSchema } from "@/actions/Candidate/fetchAttemptRuntime/schema";
import { CandidateAttemptRunner } from "@/components/Candidate/CandidateAttemptRunner/CandidateAttemptRunner";
import { requireAuth } from "@/lib/auth";

type PageProps = {
  params: Promise<{
    attemptId: string;
  }>;
};

export default async function CandidateAttemptPage({ params }: PageProps) {
  const user = await requireAuth();

  if (user.role !== "CANDIDATE" && user.role !== "EMPLOYER") {
    redirect("/sign-in");
  }

  const { attemptId } = await params;

  const payload = fetchAttemptRuntimeSchema.parse({
    candidateId: user.id,
    attemptId,
  });

  const runtimeResult = await fetchAttemptRuntimeAction(payload);

  if (!runtimeResult.success) {
    redirect("/candidate/dashboard");
  }

  const runtime = runtimeResult.data;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <CandidateAttemptRunner
        attemptId={attemptId}
        initialRuntime={{
          attemptId: runtime.attemptId,
          examId: runtime.examId,
          examTitle: runtime.examTitle,
          status: runtime.status,
          durationMinutes: runtime.durationMinutes,
          remainingSeconds: runtime.remainingSeconds,
          violations: runtime.violations,
          questions: runtime.questions,
          answers: runtime.answers,
        }}
      />
    </main>
  );
}
