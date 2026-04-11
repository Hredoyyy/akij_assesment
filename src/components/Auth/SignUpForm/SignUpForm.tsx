"use client";

import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { getDashboardPathByRole } from "@/lib/routes";
import { signUpSchema } from "@/actions/Auth/signUp/schema";
import type { AuthApiResponse } from "@/types/auth/forms";

const signUpFormSchema = signUpSchema.extend({
  confirmPassword: z.string().min(8, "Confirm password is required."),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type SignUpValues = z.infer<typeof signUpFormSchema>;

export function SignUpForm() {
  const router = useRouter();
  const [requestError, setRequestError] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  async function onSubmit(values: SignUpValues) {
    setRequestError(null);

    try {
      const payload = {
        email: values.email,
        password: values.password,
        name: values.name || undefined,
      };

      const response = await axios.post<AuthApiResponse>("/api/auth/sign-up", payload);
      const redirectTo = getDashboardPathByRole(response.data.data.role);
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      if (error instanceof AxiosError) {
        setRequestError(error.response?.data?.error ?? "Unable to sign up.");
        return;
      }

      setRequestError("Unable to sign up.");
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mt-6 w-full space-y-8 rounded-2xl border border-slate-200 bg-white px-8 pb-10 pt-8"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
            {...form.register("name")}
          />
          {form.formState.errors.name ? (
            <p className="text-sm text-rose-600">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email/ User ID
          </label>
          <input
            id="email"
            type="email"
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
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter your password"
            className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-sm text-rose-600">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm your password"
            className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="text-sm text-rose-600">{form.formState.errors.confirmPassword.message}</p>
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
        {form.formState.isSubmitting ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
