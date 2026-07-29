"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type AppShellHeaderProps = {
  email: string | null;
};

const navLinks = [
  { href: "/app", label: "Trang chủ", exact: true },
  { href: "/app/uploads", label: "Tải lên", exact: false },
  { href: "/app/analytics", label: "Phân tích", exact: false },
];

export function AppShellHeader({ email }: AppShellHeaderProps) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
      <Link href="/app" className="text-sm font-semibold">
        HOAI
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              isActive(link.href, link.exact)
                ? "bg-muted font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
        <ThemeToggle />
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Đăng xuất
          </Button>
        </form>
        <span className="text-xs text-muted-foreground">{email}</span>
      </nav>
    </header>
  );
}
