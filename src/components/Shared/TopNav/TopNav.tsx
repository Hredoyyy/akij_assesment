import Link from "next/link";

export function TopNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          Assessment Platform
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
          <Link href="/sign-in" className="hover:text-slate-900">
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </header>
  );
}
