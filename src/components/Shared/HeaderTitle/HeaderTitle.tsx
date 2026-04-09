"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderTitleProps = {
  href: string;
};

function getHeaderTitle(pathname: string): string {
  if (pathname.startsWith("/employer/dashboard") || pathname.startsWith("/candidate/dashboard")) {
    return "Dashboard";
  }

  if (pathname.startsWith("/employer/tests/new")) {
    return "Online test";
  }

  if (pathname.startsWith("/candidate/attempts/")) {
    return "Akij Resource";
  }

  return "Akij Resource";
}

export function HeaderTitle({ href }: HeaderTitleProps) {
  const pathname = usePathname();
  const title = getHeaderTitle(pathname);

  return (
    <Link href={href} className="app-header-title-link">
      <span className="app-header-title">{title}</span>
    </Link>
  );
}
