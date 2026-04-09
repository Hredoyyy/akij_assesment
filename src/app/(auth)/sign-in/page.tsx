import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/Auth/SignInForm/SignInForm";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardPathByRole } from "@/lib/routes";

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDashboardPathByRole(user.role));
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-slate-900">Sign In</h1>
      <p className="mt-3 text-slate-600">
        Enter your credentials to continue to your dashboard.
      </p>
      <SignInForm />
      <p className="mt-4 text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-slate-900 underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
