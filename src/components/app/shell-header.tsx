"use client";

import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";

type AppShellHeaderProps = {
  email: string | null;
};

export function AppShellHeader({ email }: AppShellHeaderProps) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={toggleSidebar}>
          {sidebarOpen ? "Hide menu" : "Menu"}
        </Button>
        <span className="text-sm font-medium">duongvu-erp</span>
      </div>
      <span className="text-sm text-muted-foreground">{email}</span>
    </header>
  );
}
