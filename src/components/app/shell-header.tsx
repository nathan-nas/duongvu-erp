"use client";

import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";

type AppShellHeaderProps = {
  email: string | null;
};

export function AppShellHeader({ email }: AppShellHeaderProps) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={toggleSidebar}>
          {sidebarOpen ? "Ẩn menu" : "Mở menu"}
        </Button>
        <Link href="/app" className="text-sm font-medium">
          HOAI
        </Link>
      </div>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/app">Trang chủ</Link>
        <Link href="/app/uploads">Tải lên</Link>
        <Link href="/app/analytics">Phân tích</Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Đăng xuất
          </Button>
        </form>
        <span className="text-muted-foreground">{email}</span>
      </nav>
    </header>
  );
}
