import { redirect } from "next/navigation";

import { fetchEmployerExamsAction } from "@/actions/Exam/fetchEmployerExams/logic";
import { fetchEmployerExamsSchema } from "@/actions/Exam/fetchEmployerExams/schema";
import { EmployerDashboardPanel } from "@/components/Employer/EmployerDashboardPanel/EmployerDashboardPanel";
import { requireAuth } from "@/lib/auth";

export default async function EmployerDashboardPage() {
  const user = await requireAuth();

  if (user.role !== "EMPLOYER") {
    redirect("/sign-in");
  }

  const payload = fetchEmployerExamsSchema.parse({ employerId: user.id });
  const examsResult = await fetchEmployerExamsAction(payload);

  const exams = examsResult.success ? examsResult.data : [];

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
      <EmployerDashboardPanel exams={exams} />
    </main>
  );
}
