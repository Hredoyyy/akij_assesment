export function getHeaderTitle(pathname: string): string {
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
