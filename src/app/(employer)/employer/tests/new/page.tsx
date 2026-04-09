import { redirect } from "next/navigation";

import { ExamCreationFlow } from "@/components/Employer/ExamCreationFlow/ExamCreationFlow";
import { requireAuth } from "@/lib/auth";

export default async function NewEmployerTestPage() {
  const user = await requireAuth();

  if (user.role !== "EMPLOYER") {
    redirect("/sign-in");
  }

  return <ExamCreationFlow />;
}
