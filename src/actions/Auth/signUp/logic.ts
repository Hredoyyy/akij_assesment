import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";
import type { SignUpInput } from "./schema";

type SignUpResultData = {
  id: string;
  email: string;
  name: string | null;
  role: "EMPLOYER" | "CANDIDATE";
};

export async function signUpAction(
  payload: SignUpInput,
): Promise<ActionResult<SignUpResultData>> {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      success: false,
      error: "An account with this email already exists.",
    };
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const createdUser = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash,
      name: payload.name?.trim() || null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return {
    success: true,
    data: {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
    },
  };
}
