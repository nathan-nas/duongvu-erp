import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">duongvu-erp</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Agent-ready shell
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Product features come later. Sign in to reach the protected app area.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/login" className={cn(buttonVariants())}>
          Sign in
        </Link>
        <Link
          href="/signup"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
