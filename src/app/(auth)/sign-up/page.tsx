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
    <main className="mx-auto flex w-full max-w-[571px] flex-col items-center px-4 pb-12 pt-20 sm:px-6">
      <h1 className="text-[40px] font-semibold leading-[130%] text-slate-700">Sign Up</h1>
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
