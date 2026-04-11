import type { SessionUser, UserRole } from "@/types/auth";

export type DashboardSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

export type HeaderTitleProps = {
  href: string;
};

export type UserProfileMenuProps = {
  user: SessionUser;
};

export type DashboardRoleSwitcherProps = {
  role: UserRole;
};

export type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeightClassName?: string;
  showList?: boolean;
  showUnderline?: boolean;
};
