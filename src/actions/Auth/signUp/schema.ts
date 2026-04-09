import { z } from "zod";

export const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().min(1).max(80).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
