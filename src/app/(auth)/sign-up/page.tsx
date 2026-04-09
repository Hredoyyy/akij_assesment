import Link from "next/link";
import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/Auth/SignUpForm/SignUpForm";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardPathByRole } from "@/lib/routes";

export default async function SignUpPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDashboardPathByRole(user.role));
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-slate-900">Sign Up</h1>
      <p className="mt-3 text-slate-600">
        Create your account. New sign-ups are assigned candidate role by default.
      </p>
      <SignUpForm />
      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-slate-900 underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
