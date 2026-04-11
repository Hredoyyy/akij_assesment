export default function CandidateAttemptLoading() {
  return (
    <main className="mx-auto w-full max-w-[849px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="h-7 w-40 rounded bg-slate-200" />
            <div className="h-12 w-40 rounded-xl bg-slate-200" />
          </div>
        </div>

        <div className="h-14 rounded-xl border border-slate-200 bg-slate-100" />

        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-8 w-2/3 rounded bg-slate-200" />
          <div className="space-y-3">
            <div className="h-12 rounded-lg border border-slate-200 bg-slate-100" />
            <div className="h-12 rounded-lg border border-slate-200 bg-slate-100" />
            <div className="h-12 rounded-lg border border-slate-200 bg-slate-100" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="h-12 w-full rounded-xl bg-slate-200 sm:w-44" />
            <div className="h-12 w-full rounded-xl bg-slate-200 sm:w-44" />
          </div>
        </div>
      </div>
    </main>
  );
}
