import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Không tìm thấy trang</h1>
      <p className="text-sm text-muted-foreground">
        Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.
      </p>
      <Link href="/" className={cn(buttonVariants())}>
        Về trang chủ
      </Link>
    </main>
  );
}
