export default function NewTestLoading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-5">
            <div className="h-8 w-56 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-100" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-6">
            <div className="h-7 w-44 rounded bg-slate-200" />
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-12 rounded-lg bg-slate-100" />
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-12 rounded-lg bg-slate-100" />
              <div className="h-12 rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="h-12 w-full rounded-xl bg-slate-200 sm:w-44" />
            <div className="h-12 w-full rounded-xl bg-slate-200 sm:w-44" />
          </div>
        </div>
      </div>
    </main>
  );
}
