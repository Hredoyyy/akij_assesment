import { redirect } from "next/navigation";

import { fetchAvailableExamsAction } from "@/actions/Candidate/fetchAvailableExams/logic";
import { fetchAvailableExamsSchema } from "@/actions/Candidate/fetchAvailableExams/schema";
import { CandidateExamList } from "@/components/Candidate/CandidateExamList/CandidateExamList";
import { requireAuth } from "@/lib/auth";

export default async function CandidateDashboardPage() {
  const user = await requireAuth();

  if (user.role !== "CANDIDATE" && user.role !== "EMPLOYER") {
    redirect("/sign-in");
  }

  const payload = fetchAvailableExamsSchema.parse({ candidateId: user.id });
  const examsResult = await fetchAvailableExamsAction(payload);

  const exams = examsResult.success ? examsResult.data : [];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-slate-900">Candidate Dashboard</h1>
      <p className="mt-3 text-slate-600">Start or resume your available assessments.</p>

      <CandidateExamList
        exams={exams.map((exam) => ({
          ...exam,
          slotStartTime: exam.slotStartTime.toISOString(),
          slotEndTime: exam.slotEndTime.toISOString(),
        }))}
      />
    </main>
  );
}
