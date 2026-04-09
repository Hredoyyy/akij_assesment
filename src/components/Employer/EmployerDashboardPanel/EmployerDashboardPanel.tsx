"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EmployerExamSummary = {
  id: string;
  title: string;
  totalCandidates: number;
  totalSlots: number;
  duration: number;
  createdAt: Date;
};

type EmployerDashboardPanelProps = {
  exams: EmployerExamSummary[];
};

export function EmployerDashboardPanel({ exams }: EmployerDashboardPanelProps) {
  const [search, setSearch] = useState("");

  const filteredExams = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return exams;
    }

    return exams.filter((exam) => exam.title.toLowerCase().includes(query));
  }, [exams, search]);

  return (
    <section className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="grid items-center gap-3 md:grid-cols-[1fr_1.2fr_1fr]">
        <h2 className="text-xl font-semibold text-slate-900">Your Exams</h2>

        <div className="md:justify-self-center md:w-full md:max-w-md">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search exams by test name"
          />
        </div>

        <div className="md:justify-self-end">
          <div className="flex items-center justify-end gap-2">
            <Button asChild variant="outline">
              <Link href="/candidate/dashboard">Switch to Candidate Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/employer/tests/new">Add New Test</Link>
            </Button>
          </div>
        </div>
      </header>

      {filteredExams.length === 0 ? (
        <p className="text-sm text-slate-600">No exams found.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredExams.map((exam) => (
            <article key={exam.id} className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-base font-semibold text-slate-900">{exam.title}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {exam.totalCandidates} candidates • {exam.totalSlots} slots • {exam.duration} mins
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Created {new Date(exam.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
