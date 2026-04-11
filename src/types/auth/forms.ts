import type { UserRole } from "@/types/auth";

export type AuthApiResponse = {
  success: true;
  data: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
  };
};
