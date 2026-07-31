import type { ReactNode } from "react";
import { AuthBrandPanel } from "./auth-brand-panel";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <main className="grid min-h-full flex-1 lg:grid-cols-2">
      <AuthBrandPanel title={title} subtitle={subtitle} />
      <div className="relative flex flex-col items-center justify-center bg-[oklch(0.965_0.005_90)] px-6 py-12 dark:bg-background">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, color-mix(in oklch, var(--primary) 18%, transparent), transparent 42%), radial-gradient(circle at 80% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 36%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 w-full max-w-sm motion-enter">{children}</div>
      </div>
    </main>
  );
}
