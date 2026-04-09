import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";
import type { SignInInput } from "./schema";

type SignInResultData = {
  id: string;
  email: string;
  name: string | null;
  role: "EMPLOYER" | "CANDIDATE";
};

export async function signInAction(
  payload: SignInInput,
): Promise<ActionResult<SignInResultData>> {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);

  if (!passwordMatches) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  return {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}
