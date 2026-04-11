import Image from "next/image";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { getDashboardPathByRole } from "@/lib/routes";

import { DashboardRoleSwitcher } from "../DashboardRoleSwitcher/DashboardRoleSwitcher";
import { HeaderTitle } from "../HeaderTitle/HeaderTitle";
import { UserProfileMenu } from "../UserProfileMenu/UserProfileMenu";

export async function TopNav() {
  const user = await getCurrentUser();
  const homeHref = user ? getDashboardPathByRole(user.role) : "/";

  return (
    <header className="app-header">
      <nav className="app-header-inner" aria-label="Primary">
        <div className="app-header-left">
          <Link href={homeHref} className="app-brand-link" aria-label="Go to dashboard home">
            <Image
              src="/header_logo.svg"
              alt="Akij Resource logo"
              width={116}
              height={32}
              className="app-brand-logo"
              priority
            />
          </Link>
        </div>

        <HeaderTitle href={homeHref} />

        <div className="app-header-right">
          {user ? (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <DashboardRoleSwitcher role={user.role} />
              <UserProfileMenu user={user} />
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
