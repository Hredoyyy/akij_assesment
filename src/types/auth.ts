export type UserRole = "EMPLOYER" | "CANDIDATE";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

export type SessionData = {
  user?: SessionUser;
};
