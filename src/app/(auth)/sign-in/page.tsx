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
    <main className="mx-auto flex w-full max-w-[571px] flex-col items-center px-4 pb-12 pt-20 sm:px-6">
      <h1 className="text-[40px] font-semibold leading-[130%] text-slate-700">Sign In</h1>
      <SignInForm />
    </main>
  );
}
