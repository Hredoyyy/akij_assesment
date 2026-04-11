"use client";

import { useMemo, useState } from "react";

import { EmployerDashboardHeader } from "@/components/Employer/components/EmployerDashboardHeader/EmployerDashboardHeader";
import { EmptyExamListState } from "@/components/Employer/components/EmptyExamListState/EmptyExamListState";
import { EmployerExamCard } from "@/components/Employer/components/EmployerExamCard/EmployerExamCard";
import type { EmployerDashboardPanelProps } from "@/types/employer/components";

export function EmployerDashboardPanel({ exams }: EmployerDashboardPanelProps) {
  const [search, setSearch] = useState("");

  const filteredExams = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return exams;
    }

    return exams.filter((exam) => exam.title.toLowerCase().includes(query));
  }, [exams, search]);

  const hasNoExams = exams.length === 0;
  const hasNoSearchResults = exams.length > 0 && filteredExams.length === 0;

  return (
    <section className="mt-8 space-y-4">
      <EmployerDashboardHeader search={search} onSearchChange={setSearch} />

      {hasNoExams ? (
        <EmptyExamListState
          title="No Online Tests Yet"
          description="No exams are available right now. Create a new test to start tracking candidate assessments."
        />
      ) : hasNoSearchResults ? (
        <EmptyExamListState
          title="No Matching Exams Found"
          description="Try changing your search keyword or clear the search field to see all available tests."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredExams.map((exam) => (
            <EmployerExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </section>
  );
}
