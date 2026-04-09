"use client";

import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { getDashboardPathByRole } from "@/lib/routes";
import { signInSchema } from "@/actions/Auth/signIn/schema";

type SignInValues = z.infer<typeof signInSchema>;

type AuthApiResponse = {
  success: true;
  data: {
    id: string;
    email: string;
    name: string | null;
    role: "EMPLOYER" | "CANDIDATE";
  };
};

export function SignInForm() {
  const router = useRouter();
  const [requestError, setRequestError] = useState<string | null>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInValues) {
    setRequestError(null);

    try {
      const response = await axios.post<AuthApiResponse>("/api/auth/sign-in", values);
      const redirectTo = getDashboardPathByRole(response.data.data.role);
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      if (error instanceof AxiosError) {
        setRequestError(error.response?.data?.error ?? "Unable to sign in.");
        return;
      }

      setRequestError("Unable to sign in.");
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-sm text-rose-600">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-rose-600">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      {requestError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{requestError}</p>
      ) : null}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
