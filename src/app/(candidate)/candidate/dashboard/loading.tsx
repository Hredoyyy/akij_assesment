export default function CandidateDashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-8 w-44 rounded-lg bg-slate-200" />
          <div className="h-12 w-full rounded-lg bg-slate-200 lg:w-[621px]" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-6 w-2/3 rounded bg-slate-200" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-5 w-full rounded bg-slate-100" />
                <div className="h-5 w-full rounded bg-slate-100" />
                <div className="h-5 w-full rounded bg-slate-100" />
                <div className="h-5 w-full rounded bg-slate-100" />
              </div>
              <div className="h-10 w-36 rounded-xl bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
