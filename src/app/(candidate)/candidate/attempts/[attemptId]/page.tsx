import { redirect } from "next/navigation";

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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <CandidateAttemptRunner attemptId={attemptId} />
    </main>
  );
}
