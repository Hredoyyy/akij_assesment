"use client";

import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

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
      className="mt-6 w-full space-y-10 rounded-2xl border border-slate-200 bg-white px-8 pb-10 pt-8"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email/ User ID
          </label>
          <input
            id="email"
            type="text"
            autoComplete="email"
            placeholder="Enter your email/User ID"
            className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
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

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="h-12 w-full rounded-lg border border-slate-300 px-3 pr-10 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
              {...form.register("password")}
            />

            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex justify-end">
            <button type="button" className="text-sm font-medium text-slate-700">
              Forget Password?
            </button>
          </div>

          {form.formState.errors.password ? (
            <p className="text-sm text-rose-600">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
      </div>

      {requestError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{requestError}</p>
      ) : null}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="h-12 w-full rounded-xl bg-primary px-8 text-lg font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
      </button>

      <div className="flex justify-center">
        <Link
          href="/sign-up"
          className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-primary"
        >
          Don&apos;t have an account? Sign Up
        </Link>
      </div>
    </form>
  );
}
