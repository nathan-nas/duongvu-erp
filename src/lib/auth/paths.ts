export function isProtectedPath(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}

export function isAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup";
}
