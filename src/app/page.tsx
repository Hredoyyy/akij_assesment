import Link from "next/link";

export default function Home() {
  return (
    <main className="flex w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center flex flex-col items-center">
        <h1 className="text-3xl font-semibold text-slate-900">
          Online Assessment Platform
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Welcome to the Online Assessment Platform! Built by <b>Rakibul Hassan Hredoy</b>
        </p>
        <p className="mt-3 max-w-2xl text-slate-600">
          This has a fully working backend and frontend with authentication, role-based access control, and more. Explore the features by creating an account or signing in.
        </p>

        <div className="mt-6 w-full flex flex-col items-center">
          <span className="text-base font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 mb-2 shadow-sm">
            <span className="block text-lg font-bold text-primary-800 mb-1">Employer Sign-in Credentials</span>
            <span className="block text-slate-800"><b>Email:</b> akij@ibos.com</span>
            <span className="block text-slate-800"><b>Password:</b> ibos1234</span>
          </span>
          <span className="text-xs text-slate-500">Use these credentials to sign in as an employer.</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
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
