export default function EmployerDashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-32 rounded-lg bg-slate-200" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-8 w-40 rounded-lg bg-slate-200" />
          <div className="flex w-full flex-wrap items-center justify-end gap-3 lg:w-auto">
            <div className="h-12 w-full rounded-lg bg-slate-200 lg:w-[621px]" />
            <div className="h-12 w-40 rounded-xl bg-slate-200" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8">
              <div className="h-6 w-2/3 rounded bg-slate-200" />
              <div className="grid gap-3">
                <div className="h-5 w-full rounded bg-slate-100" />
                <div className="h-5 w-full rounded bg-slate-100" />
                <div className="h-5 w-full rounded bg-slate-100" />
              </div>
              <div className="h-12 w-44 rounded-xl bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
