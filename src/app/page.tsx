import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">
          Online Assessment Platform
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Milestone 1 is active: Prisma 7 schema, adapter-based client setup,
          session-backed in-house auth API routes, and proxy route protection.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/sign-up"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Create Account
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
