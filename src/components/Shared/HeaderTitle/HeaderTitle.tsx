"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getHeaderTitle } from "@/lib/shared/headerTitle";
import type { HeaderTitleProps } from "@/types/shared/components";

export function HeaderTitle({ href }: HeaderTitleProps) {
  const pathname = usePathname();
  const title = getHeaderTitle(pathname);

  return (
    <Link href={href} className="app-header-title-link">
      <span className="app-header-title">{title}</span>
    </Link>
  );
}
