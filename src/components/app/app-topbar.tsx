"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUiStore } from "@/stores/ui-store";

type Props = { email: string | null };

export function AppTopbar({ email }: Props) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  const name = email?.split("@")[0] ?? "bạn";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={toggleSidebar}
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </Button>
        <h1 className="text-sm font-medium">
          Xin chào, <span className="font-semibold">{name}</span>!
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {email?.[0]?.toUpperCase() ?? "U"}
        </div>
      </div>
    </header>
  );
}
