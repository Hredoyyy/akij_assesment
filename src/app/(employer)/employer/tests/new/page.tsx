import { redirect } from "next/navigation";

import { fetchExamDraftAction } from "@/actions/Exam/fetchExamDraft/logic";
import { fetchExamDraftSchema } from "@/actions/Exam/fetchExamDraft/schema";
import { ExamCreationFlow } from "@/components/Employer/ExamCreationFlow/ExamCreationFlow";
import { requireAuth } from "@/lib/auth";

type NewEmployerTestPageProps = {
  searchParams: Promise<{
    examId?: string;
  }>;
};

export default async function NewEmployerTestPage({ searchParams }: NewEmployerTestPageProps) {
  const user = await requireAuth();

  if (user.role !== "EMPLOYER") {
    redirect("/sign-in");
  }

  const params = await searchParams;

  if (!params.examId) {
    return <ExamCreationFlow mode="new" />;
  }

  const parsed = fetchExamDraftSchema.safeParse({
    examId: params.examId,
    employerId: user.id,
  });

  if (!parsed.success) {
    redirect("/employer/dashboard");
  }

  const result = await fetchExamDraftAction(parsed.data);

  if (!result.success) {
    redirect("/employer/dashboard");
  }

  return <ExamCreationFlow mode="edit" initialDraft={result.data} />;
}
